import React from "react";
import { useTranslation } from "react-i18next";

class AppErrorBoundaryInner extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("AppErrorBoundary caught an error:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export default function AppErrorBoundary({ children }) {
  const { t } = useTranslation();

  return (
    <AppErrorBoundaryInner
      fallback={
        <section style={fallbackStyle}>
          <h1 style={{ marginTop: 0 }}>{t("common.unexpectedErrorTitle")}</h1>
          <p style={{ marginBottom: 0 }}>{t("common.unexpectedErrorDescription")}</p>
        </section>
      }
    >
      {children}
    </AppErrorBoundaryInner>
  );
}

const fallbackStyle = {
  minHeight: "100vh",
  display: "grid",
  alignContent: "center",
  justifyItems: "center",
  gap: 10,
  padding: 24,
  textAlign: "center",
};
