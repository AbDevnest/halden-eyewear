import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import Story from './components/Story.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
  return (
    <>
      <a className="skip-link" href="#collection">
        Skip to content
      </a>
      <Header />
      <main>
        <Hero />
        <Story />
      </main>
      <Footer />
    </>
  );
}
