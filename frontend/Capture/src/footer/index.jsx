import { Link } from "react-router-dom";
import "./footer.css";
const socials = [
  {
    name: "Facebook",
    logo: "/facebook.png",
    link: "https://www.facebook.com",
  },
  {
    name: "Twitter",
    logo: "/twitter.png",
    link: "https://www.twitter.com",
  },
  {
    name: "Instagram",
    logo: "/instagram.png",
    link: "https://www.instagram.com",
  },
  {
    name: "LinkedIn",
    logo: "/linkedin.png",
    link: "https://www.linkedin.com",
  },
];

export default function Footer() {
  return (
    <>
      <footer>
        <ul>
          {socials.map((social, index) => (
            <li key={index}>
              <Link to={social.link} target="_blank">
                <img
                  src={social.logo}
                  alt={social.name}
                  height={50}
                  width={50}
                />
              </Link>
            </li>
          ))}
        </ul>
        <p>{String.fromCharCode(169)} 2024 Fox_Movies. All rights reserved</p>
      </footer>
    </>
  );
}
