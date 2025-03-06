import { useState } from "react";
import "./header.css";

const messages = [
  "Real-time chat available !",
  "Join our forum to discuss with the community",
  "Discover our new games section",
  "Update your profile to enjoy all features",
];

function Header() {
  const [currentMessage] = useState(0);

  return (
    <header>
      <div className="header-infos">
        <span>{messages[currentMessage]}</span>
      </div>
    </header>
  );
}

export default Header;
