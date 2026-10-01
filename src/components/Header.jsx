import { useEffect, useRef, useState } from 'react';
import { brand, navLinks } from '../config';
import { SearchIcon, AccountIcon, CartIcon, MenuIcon, CloseIcon } from './icons.jsx';

export default function Header() {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const buttonRef = useRef(null);
  const firstLinkRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const root = document.documentElement;
    root.style.overflow = 'hidden';
    firstLinkRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      root.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // The header is transparent while the hero is pinned and gets a soft backing
  // as soon as the hero is released, so it stays legible over what scrolls under it.
  useEffect(() => {
    const hero = document.getElementById('top');
    if (!hero) return undefined;
    const update = () => setSolid(hero.getBoundingClientRect().bottom <= window.innerHeight + 1);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  const close = () => setOpen(false);

  return (
    <header className={`header${solid ? ' is-solid' : ''}`}>
      <nav className="header__nav" aria-label="Primary">
        {navLinks.map((link) => (
          <a key={link.label} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>

      <a className="brand" href="#top" aria-label={`${brand.name} ${brand.descriptor} — home`}>
        <span className="brand__name">{brand.name}</span>
        <span className="brand__descriptor">{brand.descriptor}</span>
      </a>

      <div className="header__tools">
        <a href="#search" aria-label="Search">
          <SearchIcon />
        </a>
        <a href="#account" aria-label="Account">
          <AccountIcon />
        </a>
        <a href="#cart" aria-label="Cart">
          <CartIcon />
        </a>
      </div>

      <button
        ref={buttonRef}
        type="button"
        className="header__menu-button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>

      <div id="mobile-menu" className="menu" hidden={!open}>
        <nav aria-label="Mobile">
          {navLinks.map((link, i) => (
            <a key={link.label} href={link.href} onClick={close} ref={i === 0 ? firstLinkRef : null}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="menu__tools">
          <a href="#search" onClick={close}>
            Search
          </a>
          <a href="#account" onClick={close}>
            Account
          </a>
          <a href="#cart" onClick={close}>
            Cart
          </a>
        </div>
      </div>
    </header>
  );
}
