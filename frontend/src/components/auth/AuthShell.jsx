import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../common/LanguageSwitcher";
import "./AuthShell.css";

export default function AuthShell({
  badge,
  title,
  subtitle,
  children,
  footerText,
  footerLinkLabel,
  footerLinkTo,
}) {
  const { t } = useTranslation();

  return (
    <section className="auth-page">
      <div className="auth-shell">
        <aside className="auth-showcase" aria-hidden="true">
          <div className="auth-showcase__content">
            <h2>{t("map.title")}</h2>
            <div className="auth-showcase__media" />
          </div>
        </aside>

        <div className="auth-card">
          <div className="auth-head">
            <div className="auth-head__copy">
              {badge ? <p className="auth-badge">{badge}</p> : null}
              <h1>{title}</h1>
              {subtitle ? <p className="auth-subtitle">{subtitle}</p> : null}
            </div>
            <div className="auth-head__controls">
              <LanguageSwitcher />
            </div>
          </div>

          {children}

          {footerText && footerLinkLabel && footerLinkTo ? (
            <p className="auth-footer">
              {footerText} <Link to={footerLinkTo}>{footerLinkLabel}</Link>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
