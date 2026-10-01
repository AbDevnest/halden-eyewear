import { brand, navLinks } from '../config';

export default function Footer() {
  return (
    <footer id="about" className="footer">
      <p className="footer__brand">
        {brand.name} {brand.descriptor}
      </p>
      <nav className="footer__nav" aria-label="Footer">
        {navLinks.map((link) => (
          <a key={link.label} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>
      <p className="footer__legal">&copy; 2026 {brand.name} {brand.descriptor}</p>
    </footer>
  );
}
