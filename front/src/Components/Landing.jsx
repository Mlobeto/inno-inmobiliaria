
import LandingHero from "./LandingHero";
import LandingFeatures from "./LandingFeatures";
import LandingFooter from "./LandingFooter";

const Landing = () => {
  return (
    <div className="landing-container bg-bgBase min-h-screen font-Montserrat">
       <LandingHero />
       <LandingFeatures />
       <LandingFooter />
    </div>
  );
};

export default Landing;
