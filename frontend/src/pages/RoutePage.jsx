import { useTranslation } from "react-i18next";

export default function RoutePage() {
  const { t } = useTranslation();

  return <section>{t("routes.placeholder")}</section>;
}
