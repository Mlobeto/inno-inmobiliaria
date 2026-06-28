
import LandingHero from "./LandingHero";
import LandingFeatures from "./LandingFeatures";
import LandingPlans from "./LandingPlans";
import LandingFooter from "./LandingFooter";

const Landing = () => {
  return (
    <div className="landing-container bg-bgBase min-h-screen font-Montserrat">
       <LandingHero />
       <LandingFeatures />
       <LandingPlans />
       <LandingFooter />
    </div>
  );
};

export default Landing;
