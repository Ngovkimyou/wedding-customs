import DecorativeDivider from "../../components/DecorativeDivider.js";

export const metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <section className="about-page archive-surface" aria-labelledby="about-title">
      <p className="eyebrow">About the project</p>
      <h1 id="about-title">A living archive, still being assembled.</h1>
      <DecorativeDivider />
      <p>
        [Placeholder: Add a short introduction to the archive, its curator, and the family or
        community knowledge it preserves.]
      </p>
      <p>
        [Placeholder: Add information about interviews, research methods, permissions, and how
        future records will be added.]
      </p>
    </section>
  );
}
