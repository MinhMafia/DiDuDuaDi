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
      <div className="auth-card">
        <div className="auth-head">
          <div>
            <p className="auth-badge">{badge || t("auth.badge")}</p>
            <h1>{title}</h1>
            <p className="auth-subtitle">{subtitle}</p>
          </div>
          <LanguageSwitcher />
        </div>

        {children}

        {footerText && footerLinkLabel && footerLinkTo ? (
          <p className="auth-footer">
            {footerText} <Link to={footerLinkTo}>{footerLinkLabel}</Link>
          </p>
        ) : null}
      </div>
    </section>
  );
}
