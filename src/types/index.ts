export interface Formula {
  name: string;
  full_name: string;
  tap: string;
  oldnames: string[];
  aliases: string[];
  versioned_formulae: string[];
  desc: string | null;
  license: string | null;
  homepage: string;
  versions: {
    stable: string;
    head: string | null;
    bottle: boolean;
  };
  revision: number;
  keg_only: boolean;
  keg_only_reason: string | null;
  options: string[];
  build_dependencies: string[];
  dependencies: string[];
  test_dependencies: string[];
  recommended_dependencies: string[];
  optional_dependencies: string[];
  uses_from_macos: (string | { [key: string]: string })[];
  requirements: string[];
  conflicts_with: string[];
  caveats: string | null;
  installed: InstalledInfo[];
  linked_keg: string | null;
  pinned: boolean;
  outdated: boolean;
  deprecated: boolean;
  deprecation_date: string | null;
  deprecation_reason: string | null;
  disabled: boolean;
  disable_date: string | null;
  disable_reason: string | null;
  post_install_defined: boolean;
  service: unknown | null;
  head_dependencies?: {
    build_dependencies: string[];
    dependencies: string[];
    test_dependencies: string[];
    recommended_dependencies: string[];
    optional_dependencies: string[];
    uses_from_macos: (string | { [key: string]: string })[];
  };
}

export interface InstalledInfo {
  version: string;
  used_options: string[];
  built_as_bottle: boolean;
  poured_from_bottle: boolean;
  time: number;
  runtime_dependencies: RuntimeDependency[];
  installed_as_dependency: boolean;
  installed_on_request: boolean;
}

export interface RuntimeDependency {
  full_name: string;
  version: string;
  revision: number;
  pkg_version: string;
  declared_directly: boolean;
}

export interface Cask {
  token: string;
  full_token: string;
  old_tokens: string[];
  tap: string;
  name: string[];
  desc: string | null;
  homepage: string;
  url: string;
  url_specs: Record<string, unknown>;
  version: string;
  installed: string | null;
  installed_time: number | null;
  bundle_version: string | null;
  bundle_short_version: string | null;
  outdated: boolean;
  sha256: string;
  artifacts: unknown[];
  caveats: string | null;
  depends_on: {
    cask?: string[];
    formula?: string[];
    macos?: Record<string, string[]>;
  };
  conflicts_with: {
    cask?: string[];
    formula?: string[];
  } | null;
  container: unknown | null;
  auto_updates: boolean | null;
  deprecated: boolean;
  deprecation_date: string | null;
  deprecation_reason: string | null;
  disabled: boolean;
  disable_date: string | null;
  disable_reason: string | null;
  tap_git_head: string;
  languages: string[];
}

export interface Favorite {
  id?: number;
  name: string;
  type: "formula" | "cask";
  createdAt: number;
}

export interface Tag {
  id?: number;
  name: string;
  type: "formula" | "cask";
  tag: string;
  createdAt: number;
}

export interface SyncMeta {
  key: string;
  value: unknown;
}

export type PackageType = "formula" | "cask";

export interface SearchFilters {
  type: PackageType | "all";
  tag: string | null;
  favoritesOnly: boolean;
}
