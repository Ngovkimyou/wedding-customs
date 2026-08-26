export default function SectionHeading({ eyebrow, title, children, count, id, className }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 className={className} id={id}>
          {title}
        </h2>
        {children ? <div className="section-heading__copy">{children}</div> : null}
      </div>
      {count ? <p className="section-heading__count">{count}</p> : null}
    </div>
  );
}
