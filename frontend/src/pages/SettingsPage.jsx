import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { setAutoPlayAudio } from "../store/slices/appSlice";
import { SUPPORTED_LANGUAGES } from "../i18n";

import {
  Card,
  Typography,
  Space,
  Switch,
  Tag,
  Divider,
} from "antd";

import { motion } from "framer-motion";
import LanguageSwitcher from "../components/common/LanguageSwitcher";

const { Title, Text } = Typography;

export default function SettingsPage() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const autoPlayAudio = useSelector((state) => state.app.autoPlayAudio);
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;

    const syncVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };

    syncVoices();
    window.speechSynthesis.addEventListener("voiceschanged", syncVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", syncVoices);
    };
  }, []);

  const voiceSupport = SUPPORTED_LANGUAGES.map((language) => {
    const exactVoice = voices.find(
      (v) => v.lang.toLowerCase() === language.speechLocale.toLowerCase()
    );

    const fallbackVoice = voices.find((v) =>
      v.lang.toLowerCase().startsWith(language.speechLocale.slice(0, 2).toLowerCase())
    );

    return {
      ...language,
      availableVoice: exactVoice || fallbackVoice || null,
    };
  });

  const MotionCard = motion(Card);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        
        {/* HEADER */}
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ borderRadius: 16 }}
        >
          <Title level={3}>{t("settings.title")}</Title>
          <Text type="secondary">{t("settings.subtitle")}</Text>
        </MotionCard>

        {/* LANGUAGE */}
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ borderRadius: 16 }}
        >
          <Space direction="vertical">
            <Text strong>{t("settings.language")}</Text>
            <LanguageSwitcher />
          </Space>
        </MotionCard>

        {/* MAP PROVIDER */}
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ borderRadius: 16 }}
        >
          <Text strong>{t("settings.mapProviderTitle")}</Text>
          <br />
          <Text type="secondary">
            {t("settings.mapProviderDescription")}
          </Text>

          <Divider />

          <Tag color="blue">OpenStreetMap</Tag>
          <Tag color="green">Leaflet</Tag>
        </MotionCard>

        {/* AUTO PLAY */}
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ borderRadius: 16 }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <Text strong>{t("settings.autoPlayTitle")}</Text>
              <br />
              <Text type="secondary">
                {t("settings.autoPlayDescription")}
              </Text>
            </div>

            <Switch
              checked={autoPlayAudio}
              onChange={(checked) => dispatch(setAutoPlayAudio(checked))}
            />
          </div>
        </MotionCard>

        {/* VOICE */}
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ borderRadius: 16 }}
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            <div>
              <Text strong>{t("settings.voiceTitle")}</Text>
              <br />
              <Text type="secondary">
                {t("settings.voiceDescription")}
              </Text>
            </div>

            {voiceSupport.map((lang) => (
              <Card
                key={lang.code}
                size="small"
                style={{
                  borderRadius: 12,
                  transition: "all 0.2s",
                }}
                hoverable
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <Text strong>{lang.nativeLabel}</Text>
                    <br />
                    <Text type="secondary">{lang.speechLocale}</Text>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    {lang.availableVoice ? (
                      <Tag color="green">{t("settings.voiceReady")}</Tag>
                    ) : (
                      <Tag color="red">{t("settings.voiceMissing")}</Tag>
                    )}
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {lang.availableVoice?.name ||
                        t("settings.voiceFallback")}
                    </Text>
                  </div>
                </div>
              </Card>
            ))}
          </Space>
        </MotionCard>
      </Space>
    </div>
  );
}