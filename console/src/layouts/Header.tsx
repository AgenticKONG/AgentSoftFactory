import { Layout, Space } from "antd";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import {
  FileTextOutlined,
  BookOutlined,
  QuestionCircleOutlined,
  GithubOutlined,
} from "@ant-design/icons";
import { Button, Tooltip } from "@agentscope-ai/design";
import styles from "./index.module.less";

const { Header: AntHeader } = Layout;

// Navigation URLs
const NAV_URLS = {
  docs: "",
  faq: "",
  changelog: "https://github.com/AgenticKONG/AgentSoftFactory/blob/main/CHANGELOG.md",
  github: "https://github.com/AgenticKONG/AgentSoftFactory",
} as const;

const keyToLabel: Record<string, string> = {
  chat: "nav.chat",
  "infra-center": "nav.infra",
  "project-list": "nav.registry",
  "project-setup": "nav.project",
  workstation: "nav.workstation",
  channels: "nav.channels",
  sessions: "nav.sessions",
  "cron-jobs": "nav.cronJobs",
  heartbeat: "nav.heartbeat",
  skills: "nav.skills",
  mcp: "nav.mcp",
  "agent-config": "nav.agentConfig",
  workspace: "nav.workspace",
  models: "nav.models",
  environments: "nav.environments",
};

interface HeaderProps {
  selectedKey: string;
}

export default function Header({ selectedKey }: HeaderProps) {
  const { t } = useTranslation();

  const handleNavClick = (url: string) => {
    if (url) {
      window.open(url, "_blank");
    }
  };

  return (
    <AntHeader className={styles.header}>
      <span className={styles.headerTitle}>
        {t(keyToLabel[selectedKey] || "nav.chat")}
      </span>
      <Space size="middle">
        <Tooltip title={t("header.changelog")}>
          <Button
            icon={<FileTextOutlined />}
            type="text"
            onClick={() => handleNavClick(NAV_URLS.changelog)}
            disabled={!NAV_URLS.changelog}
          >
            {t("header.changelog")}
          </Button>
        </Tooltip>
        <Tooltip title={t("header.docs")}>
          <Button
            icon={<BookOutlined />}
            type="text"
            onClick={() => handleNavClick(NAV_URLS.docs)}
            disabled={!NAV_URLS.docs}
          >
            {t("header.docs")}
          </Button>
        </Tooltip>
        <Tooltip title={t("header.faq")}>
          <Button
            icon={<QuestionCircleOutlined />}
            type="text"
            onClick={() => handleNavClick(NAV_URLS.faq)}
            disabled={!NAV_URLS.faq}
          >
            {t("header.faq")}
          </Button>
        </Tooltip>
        <Tooltip title={t("header.github")}>
          <Button
            icon={<GithubOutlined />}
            type="text"
            onClick={() => handleNavClick(NAV_URLS.github)}
            disabled={!NAV_URLS.github}
          >
            {t("header.github")}
          </Button>
        </Tooltip>
        <LanguageSwitcher />
      </Space>
    </AntHeader>
  );
}
