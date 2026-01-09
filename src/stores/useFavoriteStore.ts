import { create } from 'zustand';
import { db } from '@/db';
import type { Favorite, Tag, PackageType } from '@/types';

interface FavoriteState {
  favorites: Map<string, Favorite>;
  tags: Map<string, Set<string>>;
  allTags: Set<string>;
  isLoading: boolean;
  
  loadFromDB: () => Promise<void>;
  
  isFavorite: (name: string, type: PackageType) => boolean;
  toggleFavorite: (name: string, type: PackageType) => Promise<void>;
  
  getTags: (name: string, type: PackageType) => string[];
  addTag: (name: string, type: PackageType, tag: string) => Promise<void>;
  removeTag: (name: string, type: PackageType, tag: string) => Promise<void>;
  
  getItemsWithTag: (tag: string) => { name: string; type: PackageType }[];
}

const getKey = (name: string, type: PackageType) => `${type}:${name}`;

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favorites: new Map(),
  tags: new Map(),
  allTags: new Set(),
  isLoading: true,

  loadFromDB: async () => {
    set({ isLoading: true });
    
    const [favoritesArr, tagsArr] = await Promise.all([
      db.favorites.toArray(),
      db.tags.toArray(),
    ]);

    const favorites = new Map<string, Favorite>();
    favoritesArr.forEach((fav) => {
      favorites.set(getKey(fav.name, fav.type), fav);
    });

    const tags = new Map<string, Set<string>>();
    const allTags = new Set<string>();
    
    tagsArr.forEach((tag) => {
      const key = getKey(tag.name, tag.type);
      if (!tags.has(key)) {
        tags.set(key, new Set());
      }
      tags.get(key)!.add(tag.tag);
      allTags.add(tag.tag);
    });

    set({ favorites, tags, allTags, isLoading: false });
  },

  isFavorite: (name, type) => {
    return get().favorites.has(getKey(name, type));
  },

  toggleFavorite: async (name, type) => {
    const key = getKey(name, type);
    const { favorites } = get();
    
    if (favorites.has(key)) {
      const fav = favorites.get(key)!;
      await db.favorites.delete(fav.id!);
      
      const newFavorites = new Map(favorites);
      newFavorites.delete(key);
      set({ favorites: newFavorites });
    } else {
      const newFav: Favorite = {
        name,
        type,
        createdAt: Date.now(),
      };
      const id = await db.favorites.add(newFav);
      newFav.id = id;
      
      const newFavorites = new Map(favorites);
      newFavorites.set(key, newFav);
      set({ favorites: newFavorites });
    }
  },

  getTags: (name, type) => {
    const key = getKey(name, type);
    const tagsSet = get().tags.get(key);
    return tagsSet ? Array.from(tagsSet) : [];
  },

  addTag: async (name, type, tag) => {
    const key = getKey(name, type);
    const { tags, allTags } = get();
    
    const existingTags = tags.get(key) || new Set();
    if (existingTags.has(tag)) return;

    const newTag: Tag = {
      name,
      type,
      tag,
      createdAt: Date.now(),
    };
    await db.tags.add(newTag);

    const newTags = new Map(tags);
    const newTagSet = new Set(existingTags);
    newTagSet.add(tag);
    newTags.set(key, newTagSet);

    const newAllTags = new Set(allTags);
    newAllTags.add(tag);

    set({ tags: newTags, allTags: newAllTags });
  },

  removeTag: async (name, type, tag) => {
    const key = getKey(name, type);
    const { tags, allTags } = get();

    await db.tags
      .where('[name+type+tag]')
      .equals([name, type, tag])
      .delete();

    const newTags = new Map(tags);
    const existingTags = newTags.get(key);
    if (existingTags) {
      const newTagSet = new Set(existingTags);
      newTagSet.delete(tag);
      if (newTagSet.size === 0) {
        newTags.delete(key);
      } else {
        newTags.set(key, newTagSet);
      }
    }

    const remainingTags = await db.tags.where('tag').equals(tag).count();
    const newAllTags = new Set(allTags);
    if (remainingTags === 0) {
      newAllTags.delete(tag);
    }

    set({ tags: newTags, allTags: newAllTags });
  },

  getItemsWithTag: (tag) => {
    const { tags } = get();
    const items: { name: string; type: PackageType }[] = [];
    
    tags.forEach((tagSet, key) => {
      if (tagSet.has(tag)) {
        const [type, name] = key.split(':') as [PackageType, string];
        items.push({ name, type });
      }
    });
    
    return items;
  },
}));
