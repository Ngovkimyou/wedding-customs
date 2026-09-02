export default function SectionHeading({ eyebrow, title, children, count, id, titleClassName }) {
  return (
    <div className="section-heading">
      <div className="section-heading__inner">
        <div className="section-heading__content">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2 className={titleClassName} id={id}>
            {title}
          </h2>
          {children ? <div className="section-heading__copy">{children}</div> : null}
        </div>
        {count ? <p className="section-heading__count">{count}</p> : null}
      </div>
    </div>
  );
}
