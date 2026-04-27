import { createElement } from "react";
import {
  MdDashboard,
  MdDescription,
  MdCode,
  MdLink,
  MdGroup,
  MdAssessment,
  MdApi,
  MdExtension,
  MdStorage,
  MdAnalytics,
  MdIntegrationInstructions,
  MdSchool,
  MdMenuBook,
  MdForum,
  MdVideoLibrary,
} from "react-icons/md";
import { IconType } from "react-icons";
import { ACCENT, orgAsset } from "./ProjectDetailLayout";

const MATERIAL_ICONS: Record<string, IconType> = {
  dashboard: MdDashboard,
  docs: MdDescription,
  description: MdDescription,
  github: MdCode,
  code: MdCode,
  link: MdLink,
  community: MdGroup,
  group: MdGroup,
  data: MdAssessment,
  assessment: MdAssessment,
  metrics: MdAnalytics,
  api: MdApi,
  integration: MdIntegrationInstructions,
  storage: MdStorage,
  extension: MdExtension,
  school: MdSchool,
  menubook: MdMenuBook,
  telegram: MdForum,
  videolibrary: MdVideoLibrary,
};

function getMaterialIcon(name: string): IconType | null {
  const key = name.replace(/^icon-/, "").toLowerCase();
  return MATERIAL_ICONS[key] ?? MATERIAL_ICONS[key.replace(/-/g, "")] ?? null;
}

function getFallbackFeatureIcon(text: string): IconType {
  const value = text.toLowerCase();
  if (/telegram|entry point|join|community/.test(value)) return MdForum;
  if (/library|glossary|resource|reading|book|interview/.test(value)) return MdMenuBook;
  if (/course|learn|education|student|teacher|lesson|academy|school/.test(value)) return MdSchool;
  if (/video|watch|media/.test(value)) return MdVideoLibrary;
  if (/code|developer|build|builder|tool/.test(value)) return MdCode;
  if (/data|research|analysis|report|dashboard/.test(value)) return MdAssessment;
  return MdDashboard;
}

function FeatureIcon({ name, inline, fallbackText }: { name?: string; inline?: boolean; fallbackText?: string }) {
  const iconType = (name ? getMaterialIcon(name) : null) ?? getFallbackFeatureIcon(fallbackText ?? name ?? "");
  if (iconType) {
    return (
      <div className={`project-detail-features-icon ${inline ? "" : "project-detail-features-media"}`} aria-hidden>
        {createElement(iconType, { size: 36, color: "#000" })}
      </div>
    );
  }
  return null;
}

type FeatureItem = { title?: string; subtitle?: string; description?: string; image?: string; link?: string; linkLabel?: string; text?: string; icon?: string };
type Features = FeatureItem[] | { cards?: FeatureItem[]; items?: FeatureItem[] };

export function ProjectDetailFeatures({ features }: { features: Features | undefined }) {
  const isLegacyArray = features && Array.isArray(features) && features.length > 0;
  const isNewFormat = features && typeof features === "object" && !Array.isArray(features) && ((features as { cards?: unknown[] }).cards || (features as { items?: unknown[] }).items);
  const cards = (isNewFormat && Array.isArray((features as { cards?: FeatureItem[] }).cards) ? (features as { cards: FeatureItem[] }).cards : []) as FeatureItem[];
  const items = (isNewFormat && Array.isArray((features as { items?: FeatureItem[] }).items) ? (features as { items: FeatureItem[] }).items : []) as FeatureItem[];
  const hasCards = cards.length > 0;
  const hasItems = items.length > 0;
  const legacyFeatures = isLegacyArray ? (features as FeatureItem[]) : null;

  if (!legacyFeatures && !hasCards && !hasItems) return null;

  return (
    <section className="event-detail-section project-detail-section project-detail-features">
      <img src="/images/projects/detail/assets/title-features.webp" alt="FEATURES" className="project-detail-section-title-img" width={180} height={40} />
      {legacyFeatures ? (
        <div className="project-detail-features-grid" style={{ marginTop: 24, display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          {legacyFeatures.map((f, i) => (
            <div key={i} className="project-detail-features-card">
              {f.image && (
                <div className="project-detail-features-image project-detail-features-media">
                  <img src={orgAsset(f.image)} alt="" />
                </div>
              )}
              <div className="project-detail-features-card-body">
                <FeatureIcon name={f.icon} fallbackText={`${f.title ?? ""} ${f.subtitle ?? ""} ${f.description ?? ""} ${f.text ?? ""}`} />
                <h3 className="project-detail-features-card-title">{f.title}</h3>
                {f.subtitle && <p className="project-detail-features-card-subtitle">{f.subtitle}</p>}
                {f.description && <p className="project-detail-features-card-desc">{f.description}</p>}
              </div>
              {f.link && (
                <div className="project-detail-features-card-link-wrap">
                  <a href={f.link} target="_blank" rel="noopener noreferrer" className="project-detail-features-card-link">{f.linkLabel ?? "Learn more"} →</a>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <>
          {hasCards && (
            <div className="project-detail-features-cards" style={{ marginTop: 24 }}>
              {cards.map((f, i) => (
                <div key={i} className="project-detail-features-card">
                  {f.image && (
                    <div className="project-detail-features-image project-detail-features-media">
                      <img src={orgAsset(f.image)} alt="" />
                    </div>
                  )}
                  <div className="project-detail-features-card-body">
                    <FeatureIcon name={f.icon} fallbackText={`${f.title ?? ""} ${f.subtitle ?? ""} ${f.description ?? ""} ${f.text ?? ""}`} />
                    <h3 className="project-detail-features-card-title">{f.title}</h3>
                    {f.subtitle && <p className="project-detail-features-card-subtitle">{f.subtitle}</p>}
                    {f.description && <p className="project-detail-features-card-desc">{f.description}</p>}
                  </div>
                  {f.link && (
                    <div className="project-detail-features-card-link-wrap">
                      <a href={f.link} target="_blank" rel="noopener noreferrer" className="project-detail-features-card-link">{f.linkLabel ?? "Learn more"} →</a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {hasItems && (
            <div className="project-detail-features-icons" style={{ marginTop: hasCards ? 24 : 24 }}>
              {items.map((f, i) => (
                <div key={i} className="project-detail-features-item-row">
                  <FeatureIcon name={f.icon} inline fallbackText={`${f.text ?? ""} ${f.title ?? ""} ${f.subtitle ?? ""} ${f.description ?? ""}`} />
                  <div>
                    <p className="project-detail-features-item-text">{f.text || f.title}</p>
                    {f.link && (
                      <a href={f.link} target="_blank" rel="noopener noreferrer" className="project-detail-features-item-link">{f.linkLabel ?? "Learn more"}</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
