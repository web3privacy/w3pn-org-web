"use client";

import { orgAsset } from "./ProjectDetailLayout";

type Member = { avatar?: string; name?: string; role?: string; href?: string };

const TEAM_PLACEHOLDER = (i: number) => `https://picsum.photos/200/200?random=team${i}`;

/** Paths like /projects/explorer.png are project logos, not person avatars – use placeholder */
function isProjectAsset(path: string | undefined): boolean {
  if (!path) return false;
  return /^\/projects\/.+\.(png|jpg|jpeg|webp)$/i.test(path);
}

export function ProjectDetailTeam({ team }: { team: Member[] | undefined }) {
  if (!team?.length) return null;

  return (
    <section className="event-detail-section project-detail-section project-detail-team-section">
      <img src="/images/projects/detail/assets/title-team.webp" alt="TEAM" className="project-detail-section-title-img" width={120} height={40} />
      <div className="about-team-inner">
        <div className="about-team-grid about-team-grid--grayscale">
          {team.map((m, i) => (
            <article key={i} className="about-team-member">
              <img
                src={m.avatar && !isProjectAsset(m.avatar) ? orgAsset(m.avatar) : TEAM_PLACEHOLDER(i)}
                alt={m.name ?? ""}
                loading="lazy"
                onError={(e) => {
                  const t = e.currentTarget;
                  if (!t.src?.includes("picsum.photos")) t.src = TEAM_PLACEHOLDER(i);
                }}
              />
              <h5>{m.name}</h5>
              {m.role && <p>{m.role}</p>}
              {m.href && (
                <p>
                  <a href={m.href} target="_blank" rel="noopener noreferrer">
                    GitHub
                  </a>
                </p>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
