/**
 * InstagramPortfolio — Server Component
 * Displays a 3-column grid of placeholder portfolio images.
 * Uses plain img so it works without next.config images hostname config.
 * Gold border + 4px lift on hover per rules.md.
 */

type PortfolioImage = {
  id: string;
  url: string;
  permalink: string;
};

const STATIC_PORTFOLIO: PortfolioImage[] = [
  { id: "1", url: "https://picsum.photos/seed/ink1/800/800", permalink: "#" },
  { id: "2", url: "https://picsum.photos/seed/ink2/800/800", permalink: "#" },
  { id: "3", url: "https://picsum.photos/seed/ink3/800/800", permalink: "#" },
  { id: "4", url: "https://picsum.photos/seed/ink4/800/800", permalink: "#" },
  { id: "5", url: "https://picsum.photos/seed/ink5/800/800", permalink: "#" },
  { id: "6", url: "https://picsum.photos/seed/ink6/800/800", permalink: "#" },
];

export default function InstagramPortfolio() {
  return (
    <section>
      <div className="section-inner">
        <h2
          className="section-title"
          style={{ fontFamily: "var(--font-head)", marginBottom: "56px" }}
        >
          Latest from the Studio
        </h2>
        <div className="instagram-grid">
          {STATIC_PORTFOLIO.map((item) => (
            <a
              key={item.id}
              href={item.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="instagram-card"
            >
              <img
                src={item.url}
                alt="Portfolio tattoo design"
                className="instagram-card-img"
              />
              <span className="instagram-card-hover" aria-hidden />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
