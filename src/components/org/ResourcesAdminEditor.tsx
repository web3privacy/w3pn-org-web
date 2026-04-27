"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAdminToast } from "@/components/org/AdminToast";
import "@/styles/org/admin.css";

type ResourceAsset = {
  id?: string;
  name?: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  downloadUrl?: string;
  description?: string;
};

type ResourceGroup = {
  name?: string;
  assets?: ResourceAsset[];
};

type ResourceCategory = {
  id?: string;
  name?: string;
  order?: number;
  assets?: ResourceAsset[];
  groups?: ResourceGroup[];
};

type Kit = {
  id?: string;
  name?: string;
  description?: string;
  href?: string;
  logoUrl?: string;
};

type ResourcesConfig = {
  hero?: {
    title?: string;
    description?: string;
    backgroundImageUrl?: string;
    downloadAllLabel?: string;
    downloadAllHref?: string;
  };
  kits?: Kit[];
  expandAllLabel?: string;
  categories?: ResourceCategory[];
};

const SECTIONS = [
  { id: "hero", label: "Hero" },
  { id: "kits", label: "Kit Cards" },
  { id: "categories", label: "Categories" },
] as const;

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function AssetEditor({
  asset,
  index,
  onUpdate,
  onRemove,
}: {
  asset: ResourceAsset;
  index: number;
  onUpdate: (index: number, asset: ResourceAsset) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="org-admin-card org-admin-card--nested">
      <div className="res-admin-asset-header">
        {asset.thumbnailUrl && (
          <div className="res-admin-asset-thumb">
            <img
              src={asset.thumbnailUrl}
              alt={asset.name ?? ""}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
        <div className="res-admin-asset-fields">
          <div className="org-admin-field-grid">
            <div className="org-admin-field">
              <label>Asset name</label>
              <input
                value={asset.name ?? ""}
                onChange={(e) => onUpdate(index, { ...asset, name: e.target.value })}
                placeholder="Asset name"
                className="org-admin-input"
              />
            </div>
            <div className="org-admin-field">
              <label>ID</label>
              <input
                value={asset.id ?? ""}
                onChange={(e) => onUpdate(index, { ...asset, id: e.target.value })}
                placeholder="Auto-generated"
                className="org-admin-input"
              />
            </div>
            <div className="org-admin-field org-admin-field--full">
              <label>Thumbnail URL</label>
              <input
                value={asset.thumbnailUrl ?? ""}
                onChange={(e) => onUpdate(index, { ...asset, thumbnailUrl: e.target.value })}
                placeholder="/images/site-shared/navigation/header-logo.svg"
                className="org-admin-input"
              />
            </div>
            <div className="org-admin-field org-admin-field--full">
              <label>Download URL</label>
              <input
                value={asset.downloadUrl ?? ""}
                onChange={(e) => onUpdate(index, { ...asset, downloadUrl: e.target.value })}
                placeholder="Optional, defaults to thumbnail"
                className="org-admin-input"
              />
            </div>
            <div className="org-admin-field org-admin-field--full">
              <label>Description</label>
              <input
                value={asset.description ?? ""}
                onChange={(e) => onUpdate(index, { ...asset, description: e.target.value })}
                placeholder="Optional"
                className="org-admin-input"
              />
            </div>
          </div>
        </div>
      </div>
      <button
        type="button"
        className="org-admin-btn org-admin-btn--small org-admin-btn--danger"
        onClick={() => onRemove(index)}
      >
        Remove Asset
      </button>
    </div>
  );
}

function GroupEditor({
  group,
  groupIndex,
  onUpdateGroup,
  onRemoveGroup,
}: {
  group: ResourceGroup;
  groupIndex: number;
  onUpdateGroup: (index: number, group: ResourceGroup) => void;
  onRemoveGroup: (index: number) => void;
}) {
  const assets = useMemo(() => group.assets ?? [], [group.assets]);

  const updateAsset = useCallback(
    (assetIdx: number, updated: ResourceAsset) => {
      const next = [...assets];
      next[assetIdx] = updated;
      onUpdateGroup(groupIndex, { ...group, assets: next });
    },
    [assets, group, groupIndex, onUpdateGroup]
  );

  const removeAsset = useCallback(
    (assetIdx: number) => {
      onUpdateGroup(groupIndex, {
        ...group,
        assets: assets.filter((_, j) => j !== assetIdx),
      });
    },
    [assets, group, groupIndex, onUpdateGroup]
  );

  const addAsset = useCallback(() => {
    const newAsset: ResourceAsset = {
      id: generateId("asset"),
      name: "",
      thumbnailUrl: "",
      downloadUrl: "",
      description: "",
    };
    onUpdateGroup(groupIndex, { ...group, assets: [...assets, newAsset] });
  }, [assets, group, groupIndex, onUpdateGroup]);

  return (
    <div className="res-admin-group">
      <div className="res-admin-group-header">
        <input
          value={group.name ?? ""}
          onChange={(e) =>
            onUpdateGroup(groupIndex, { ...group, name: e.target.value })
          }
          placeholder="Group name (e.g. Web3Privacy Now!, Print Posters)"
          className="org-admin-input org-admin-input--wide"
        />
        <button
          type="button"
          className="org-admin-btn org-admin-btn--small org-admin-btn--danger"
          onClick={() => onRemoveGroup(groupIndex)}
        >
          Remove Group
        </button>
      </div>

      <div className="res-admin-assets-list">
        {assets.map((asset, aIdx) => (
          <AssetEditor
            key={asset.id ?? aIdx}
            asset={asset}
            index={aIdx}
            onUpdate={updateAsset}
            onRemove={removeAsset}
          />
        ))}
      </div>

      <button
        type="button"
        className="org-admin-btn org-admin-btn--small"
        onClick={addAsset}
      >
        + Add Asset
      </button>
    </div>
  );
}

function CategoryEditor({
  category,
  catIndex,
  totalCategories,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  category: ResourceCategory;
  catIndex: number;
  totalCategories: number;
  onUpdate: (index: number, cat: ResourceCategory) => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const groups = useMemo(() => category.groups ?? [], [category.groups]);

  const updateGroup = useCallback(
    (gIdx: number, updated: ResourceGroup) => {
      const next = [...groups];
      next[gIdx] = updated;
      onUpdate(catIndex, { ...category, groups: next });
    },
    [groups, category, catIndex, onUpdate]
  );

  const removeGroup = useCallback(
    (gIdx: number) => {
      onUpdate(catIndex, {
        ...category,
        groups: groups.filter((_, j) => j !== gIdx),
      });
    },
    [groups, category, catIndex, onUpdate]
  );

  const addGroup = useCallback(() => {
    const newGroup: ResourceGroup = { name: "", assets: [] };
    onUpdate(catIndex, { ...category, groups: [...groups, newGroup] });
  }, [groups, category, catIndex, onUpdate]);

  const totalAssets = groups.reduce(
    (sum, g) => sum + (g.assets?.length ?? 0),
    0
  );

  return (
    <div className="res-admin-category">
      <div className="res-admin-category-header" onClick={() => setIsOpen((o) => !o)}>
        <button type="button" className="res-admin-category-toggle">
          <span className={`res-admin-chevron ${isOpen ? "is-open" : ""}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
          </span>
          <strong>{category.name || "(unnamed)"}</strong>
          <span className="res-admin-category-meta">
            {groups.length} group{groups.length !== 1 ? "s" : ""}, {totalAssets} asset{totalAssets !== 1 ? "s" : ""}
          </span>
        </button>
        <div className="res-admin-category-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="org-admin-btn org-admin-btn--small"
            disabled={catIndex === 0}
            onClick={() => onMoveUp(catIndex)}
            title="Move up"
          >
            ↑
          </button>
          <button
            type="button"
            className="org-admin-btn org-admin-btn--small"
            disabled={catIndex === totalCategories - 1}
            onClick={() => onMoveDown(catIndex)}
            title="Move down"
          >
            ↓
          </button>
          <button
            type="button"
            className="org-admin-btn org-admin-btn--small org-admin-btn--danger"
            onClick={() => onRemove(catIndex)}
          >
            Delete
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="res-admin-category-body">
          <div className="org-admin-row">
            <div className="org-admin-field" style={{ flex: 1 }}>
              <label>Category name</label>
              <input
                value={category.name ?? ""}
                onChange={(e) =>
                  onUpdate(catIndex, { ...category, name: e.target.value })
                }
                placeholder="e.g. Logos, Posters, Banners"
                className="org-admin-input org-admin-input--wide"
              />
            </div>
            <div className="org-admin-field">
              <label>ID (URL anchor)</label>
              <input
                value={category.id ?? ""}
                onChange={(e) =>
                  onUpdate(catIndex, { ...category, id: e.target.value })
                }
                placeholder="e.g. logos"
                className="org-admin-input org-admin-input--sm"
              />
            </div>
            <div className="org-admin-field">
              <label>Order</label>
              <input
                type="number"
                value={category.order ?? 0}
                onChange={(e) =>
                  onUpdate(catIndex, {
                    ...category,
                    order: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="org-admin-input org-admin-input--tiny"
              />
            </div>
          </div>

          <h4>Groups</h4>
          {groups.map((group, gIdx) => (
            <GroupEditor
              key={group.name ?? gIdx}
              group={group}
              groupIndex={gIdx}
              onUpdateGroup={updateGroup}
              onRemoveGroup={removeGroup}
            />
          ))}

          <button
            type="button"
            className="org-admin-btn org-admin-btn--small"
            onClick={addGroup}
          >
            + Add Group
          </button>
        </div>
      )}
    </div>
  );
}

export default function ResourcesAdminEditor({
  initialResources,
}: {
  initialResources: ResourcesConfig;
}) {
  const [config, setConfig] = useState<ResourcesConfig>(() =>
    JSON.parse(JSON.stringify(initialResources))
  );
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [saving, setSaving] = useState(false);
  const { addToast } = useAdminToast();

  const hero = config.hero ?? {};
  const kits = config.kits ?? [];
  const categories = useMemo(
    () =>
      [...(config.categories ?? [])].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
      ),
    [config.categories]
  );

  const updateHero = useCallback(
    (next: ResourcesConfig["hero"]) => {
      setConfig((prev) => ({ ...prev, hero: next }));
    },
    []
  );

  const updateKits = useCallback((next: Kit[]) => {
    setConfig((prev) => ({ ...prev, kits: next }));
  }, []);

  const updateCategories = useCallback((next: ResourceCategory[]) => {
    const reordered = next.map((c, i) => ({ ...c, order: i }));
    setConfig((prev) => ({ ...prev, categories: reordered }));
  }, []);

  const saveToServer = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/org/resources", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ resources: config }),
      });
      if (!res.ok) throw new Error(await res.text());
      addToast("success", "Resources saved successfully");
    } catch {
      addToast("error", "Failed to save resources");
    } finally {
      setSaving(false);
    }
  }, [config, addToast]);

  const saveAndPreview = useCallback(async () => {
    await saveToServer();
    window.open("/resources", "_blank");
  }, [saveToServer]);

  const updateCategory = useCallback(
    (idx: number, cat: ResourceCategory) => {
      const next = [...categories];
      next[idx] = cat;
      updateCategories(next);
    },
    [categories, updateCategories]
  );

  const removeCategory = useCallback(
    (idx: number) => {
      updateCategories(categories.filter((_, j) => j !== idx));
    },
    [categories, updateCategories]
  );

  const moveCategoryUp = useCallback(
    (idx: number) => {
      if (idx <= 0) return;
      const next = [...categories];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      updateCategories(next);
    },
    [categories, updateCategories]
  );

  const moveCategoryDown = useCallback(
    (idx: number) => {
      if (idx >= categories.length - 1) return;
      const next = [...categories];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      updateCategories(next);
    },
    [categories, updateCategories]
  );

  const addCategory = useCallback(() => {
    const newCat: ResourceCategory = {
      id: generateId("cat"),
      name: "",
      order: categories.length,
      groups: [],
    };
    updateCategories([...categories, newCat]);
  }, [categories, updateCategories]);

  return (
    <div className="org-admin-root">
      <div className="org-admin-header">
        <h1>Resources</h1>
        <div className="org-admin-actions">
          <Link
            href="/resources"
            className="org-admin-btn org-admin-btn--secondary"
            target="_blank"
          >
            View Page
          </Link>
          <button
            type="button"
            className="org-admin-btn org-admin-btn--secondary"
            onClick={saveToServer}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            className="org-admin-btn org-admin-btn--primary"
            onClick={saveAndPreview}
            disabled={saving}
          >
            Save &amp; Preview
          </button>
        </div>
      </div>

      <div className="org-admin-layout">
        <nav className="org-admin-nav">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`org-admin-nav-item ${activeSection === s.id ? "is-active" : ""}`}
              onClick={() => setActiveSection(s.id)}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div className="org-admin-form">
          {activeSection === "hero" && (
            <section className="org-admin-block">
              <h2>Hero Section</h2>
              <p className="org-admin-hint">
                The hero banner displayed at the top of the Resources page.
              </p>
              <div className="org-admin-field">
                <label>Title</label>
                <input
                  value={hero.title ?? ""}
                  onChange={(e) =>
                    updateHero({ ...hero, title: e.target.value })
                  }
                  placeholder="Community Resources"
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-field">
                <label>Description</label>
                <textarea
                  value={hero.description ?? ""}
                  onChange={(e) =>
                    updateHero({ ...hero, description: e.target.value })
                  }
                  rows={3}
                  className="org-admin-input org-admin-input--wide"
                  placeholder="A brief description of the resources section…"
                />
              </div>
              <div className="org-admin-field">
                <label>Background image URL</label>
                <input
                  value={hero.backgroundImageUrl ?? ""}
                  onChange={(e) =>
                    updateHero({ ...hero, backgroundImageUrl: e.target.value })
                  }
                  placeholder="/images/resources/page/assets/poster-5.webp"
                  className="org-admin-input org-admin-input--wide"
                />
                {hero.backgroundImageUrl && (
                  <div className="res-admin-preview-img">
                    <img src={hero.backgroundImageUrl} alt="Hero preview" />
                  </div>
                )}
              </div>
              <div className="org-admin-field">
                <label>Download all label</label>
                <input
                  value={hero.downloadAllLabel ?? ""}
                  onChange={(e) =>
                    updateHero({ ...hero, downloadAllLabel: e.target.value })
                  }
                  placeholder="Download all"
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-field">
                <label>Download all URL</label>
                <input
                  value={hero.downloadAllHref ?? ""}
                  onChange={(e) =>
                    updateHero({ ...hero, downloadAllHref: e.target.value })
                  }
                  placeholder="/images/resources/source-files/w3pn-resources-all.zip"
                  className="org-admin-input org-admin-input--wide"
                />
              </div>
              <div className="org-admin-field">
                <label>Expand All label</label>
                <input
                  value={config.expandAllLabel ?? ""}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      expandAllLabel: e.target.value,
                    }))
                  }
                  placeholder="Expand All"
                  className="org-admin-input"
                />
              </div>
            </section>
          )}

          {activeSection === "kits" && (
            <section className="org-admin-block">
              <h2>Kit Cards</h2>
              <p className="org-admin-hint">
                Quick-access cards shown below the hero (Media Kit, Event Kit, etc.).
              </p>
              {kits.map((kit, i) => (
                <div key={kit.id ?? i} className="org-admin-card">
                  <div className="org-admin-row">
                    <input
                      value={kit.name ?? ""}
                      onChange={(e) => {
                        const next = [...kits];
                        next[i] = { ...next[i], name: e.target.value };
                        updateKits(next);
                      }}
                      placeholder="Kit name (e.g. MEDIA KIT)"
                      className="org-admin-input"
                    />
                    <input
                      value={kit.id ?? ""}
                      onChange={(e) => {
                        const next = [...kits];
                        next[i] = { ...next[i], id: e.target.value };
                        updateKits(next);
                      }}
                      placeholder="ID"
                      className="org-admin-input org-admin-input--sm"
                    />
                  </div>
                  <input
                    value={kit.description ?? ""}
                    onChange={(e) => {
                      const next = [...kits];
                      next[i] = { ...next[i], description: e.target.value };
                      updateKits(next);
                    }}
                    placeholder="Description"
                    className="org-admin-input org-admin-input--wide"
                  />
                  <div className="org-admin-row">
                    <input
                      value={kit.href ?? ""}
                      onChange={(e) => {
                        const next = [...kits];
                        next[i] = { ...next[i], href: e.target.value };
                        updateKits(next);
                      }}
                      placeholder="Link (e.g. #logos or https://...)"
                      className="org-admin-input org-admin-input--wide"
                    />
                    <input
                      value={kit.logoUrl ?? ""}
                      onChange={(e) => {
                        const next = [...kits];
                        next[i] = { ...next[i], logoUrl: e.target.value };
                        updateKits(next);
                      }}
                      placeholder="Logo image URL"
                      className="org-admin-input org-admin-input--wide"
                    />
                  </div>
                  <button
                    type="button"
                    className="org-admin-btn org-admin-btn--small org-admin-btn--danger"
                    onClick={() => updateKits(kits.filter((_, j) => j !== i))}
                  >
                    Remove Kit
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="org-admin-btn org-admin-btn--small"
                onClick={() =>
                  updateKits([
                    ...kits,
                    {
                      id: generateId("kit"),
                      name: "",
                      description: "",
                      href: "#",
                      logoUrl: "",
                    },
                  ])
                }
              >
                + Add Kit Card
              </button>
            </section>
          )}

          {activeSection === "categories" && (
            <section className="org-admin-block">
              <h2>Resource Categories</h2>
              <p className="org-admin-hint">
                Each category appears as a collapsible section on the Resources
                page. Within each category you can have multiple groups, each
                containing assets (images, files, etc.).
              </p>

              {categories.map((cat, idx) => (
                <CategoryEditor
                  key={cat.id ?? idx}
                  category={cat}
                  catIndex={idx}
                  totalCategories={categories.length}
                  onUpdate={updateCategory}
                  onRemove={removeCategory}
                  onMoveUp={moveCategoryUp}
                  onMoveDown={moveCategoryDown}
                />
              ))}

              <button
                type="button"
                className="org-admin-btn org-admin-btn--primary"
                style={{ marginTop: 16 }}
                onClick={addCategory}
              >
                + Add Category
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
