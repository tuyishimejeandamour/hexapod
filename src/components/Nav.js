import React from "react"
import { URL_LINKS, PATH_LINKS } from "./vars"
import { Link } from "react-router-dom"

const BulletPageLink = ({ link }) => (
    <li>
        <Link to={link.path} className="link-icon" title={link.description}>
            {link.icon} <span className="text-link">{link.description}</span>
        </Link>
    </li>
)

const BulletUrlLink = ({ path, description, icon }) => (
    <li>
        <a
            href={path}
            className="link-icon"
            target="_blank"
            rel="noopener noreferrer"
            title={description}
        >
            {icon} <span className="text-link">{description}</span>
        </a>
    </li>
)

const Nav = () => (
    <ul id="top-bar">
        {PATH_LINKS.map(link => (
            <BulletPageLink key={link.path} link={link} />
        ))}
        <div style={{ flex: 1 }} /> {/* Spacer */}
        {URL_LINKS.map(link => (
            <BulletUrlLink
                path={link.url}
                key={link.url}
                icon={link.icon}
                description={link.description}
            />
        ))}
    </ul>
)

export { Nav }

