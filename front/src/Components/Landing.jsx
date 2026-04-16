
import LandingHero from "./LandingHero";
import LandingFeatures from "./LandingFeatures";
import LandingFooter from "./LandingFooter";

const Landing = () => {
  return (
    <div className="landing-container">
       <LandingHero />
       <LandingFeatures />
       <LandingFooter />
    </div>
  );
};

export default Landing;