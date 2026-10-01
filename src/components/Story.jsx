const points = [
  {
    term: 'Optical clarity',
    text: 'Lenses fitted to your prescription and centred for a clear, comfortable field of view.',
  },
  {
    term: 'Everyday comfort',
    text: 'Balanced frames with soft contact points, made to stay put from morning to evening.',
  },
  {
    term: 'Considered craft',
    text: 'Refined shapes and carefully finished details, designed to suit more than one occasion.',
  },
];

export default function Story() {
  return (
    <section id="collection" className="story">
      <div className="story__inner">
        <h2 className="story__title">
          Eyewear that starts with how you see, and is finished by how it feels to wear.
        </h2>
        <dl className="story__list">
          {points.map((p) => (
            <div key={p.term} className="story__row">
              <dt>{p.term}</dt>
              <dd>{p.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
