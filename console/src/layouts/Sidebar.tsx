import {
  Layout,
  Menu,
  Button,
  Badge,
  Modal,
  Spin,
  Tooltip,
  type MenuProps,
} from "antd";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  LayoutDashboard,
  Radio,
  Zap,
  Wifi,
  UsersRound,
  CalendarClock,
  Activity,
  Sparkles,
  Briefcase,
  Cpu,
  Box,
  Globe,
  Settings,
  Plug,
  PanelLeftClose,
  PanelLeftOpen,
  Copy,
  Check,
} from "lucide-react";
import api from "../api";
import styles from "./index.module.less";

const { Sider } = Layout;

const PYPI_URL = "https://pypi.org/pypi/copaw/json";

const DEFAULT_OPEN_KEYS = [
  "project-group",
  "agent-factory-group",
  "control-group",
  "settings-group",
];

const KEY_TO_PATH: Record<string, string> = {
  chat: "/chat",
  "infra-center": "/infra-center",
  "project-list": "/projects",
  "project-setup": "/project-setup",
  workstation: "/workstation",
  "agent-market": "/agent-market",
  models: "/models",
  skills: "/skills",
  mcp: "/mcp",
  channels: "/channels",
  sessions: "/sessions",
  "cron-jobs": "/cron-jobs",
  heartbeat: "/heartbeat",
  environments: "/environments",
};

const UPDATE_MD: Record<string, string> = {
  zh: `### CoPaw如何更新...`,
  ru: `### Как обновить CoPaw...`,
  en: `### How to update CoPaw...`,
};

interface SidebarProps {
  selectedKey: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);
  return (
    <Tooltip title={copied ? t("common.copied") : t("common.copy")}>
      <Button type="text" size="small" icon={copied ? <Check size={13} /> : <Copy size={13} />} onClick={handleCopy} className={`${styles.copyBtn} ${copied ? styles.copyBtnCopied : styles.copyBtnDefault}`} />
    </Tooltip>
  );
}

export default function Sidebar({ selectedKey }: SidebarProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>(DEFAULT_OPEN_KEYS);
  const [version, setVersion] = useState<string>("");
  const [latestVersion, setLatestVersion] = useState<string>("");
  const [allVersions, setAllVersions] = useState<string[]>([]);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateMarkdown, setUpdateMarkdown] = useState<string>("");

  useEffect(() => {
    if (!collapsed) setOpenKeys(DEFAULT_OPEN_KEYS);
  }, [collapsed]);

  useEffect(() => {
    api.getVersion().then((res) => setVersion(res?.version ?? "")).catch(() => {});
  }, []);

  useEffect(() => {
    fetch(PYPI_URL).then((res) => res.json()).then((data) => {
        const releases = data?.releases ?? {};
        const versions = Object.keys(releases).sort().reverse();
        setAllVersions(versions);
        setLatestVersion(versions[0] ?? "");
    }).catch(() => {});
  }, []);

  const hasUpdate = version && allVersions.length > 0 && version !== latestVersion;

  const handleOpenUpdateModal = () => {
    setUpdateModalOpen(true);
    setUpdateMarkdown("Update instructions load...");
  };

  const menuItems: MenuProps["items"] = [
    {
      key: "infra-center",
      label: t("nav.infra"),
      icon: <Cpu size={16} />,
    },
    {
      key: "project-group",
      label: t("nav.project"),
      icon: <Briefcase size={16} />,
      children: [
        { key: "project-list", label: t("nav.registry"), icon: <Briefcase size={16} /> },
        { key: "workstation", label: t("nav.workstation"), icon: <LayoutDashboard size={16} /> },
      ],
    },
    {
      key: "agent-factory-group",
      label: "Agent Factory",
      icon: <Zap size={16} />,
      children: [
        { key: "agent-market", label: "Agents Market", icon: <Sparkles size={16} /> },
        { key: "models", label: "Models Pool", icon: <Box size={16} /> },
        { key: "skills", label: "Skills Bank", icon: <Zap size={16} /> },
        { key: "mcp", label: "MCP Protocol", icon: <Plug size={16} /> },
        { key: "channels", label: "Channels Gear", icon: <Wifi size={16} /> },
      ],
    },
    {
      key: "control-group",
      label: "Control & Task",
      icon: <Radio size={16} />,
      children: [
        { key: "sessions", label: t("nav.sessions"), icon: <UsersRound size={16} /> },
        { key: "cron-jobs", label: t("nav.cronJobs"), icon: <CalendarClock size={16} /> },
        { key: "heartbeat", label: t("nav.heartbeat"), icon: <Activity size={16} /> },
      ],
    },
    {
      key: "settings-group",
      label: t("nav.settings"),
      icon: <Settings size={16} />,
      children: [
        { key: "environments", label: t("nav.environments"), icon: <Globe size={16} /> },
      ],
    },
  ];

  return (
    <Sider collapsed={collapsed} onCollapse={setCollapsed} width={275} className={styles.sider}>
      <div className={styles.siderTop}>
        {!collapsed && (
          <div className={styles.logoWrapper}>
            <img src="/logo.png" alt="CoPaw" className={styles.logoImg} />
            {version && (
              <Badge dot={!!hasUpdate} color="red" offset={[4, 18]}>
                <span className={`${styles.versionBadge} ${hasUpdate ? styles.versionBadgeClickable : styles.versionBadgeDefault}`} onClick={() => hasUpdate && handleOpenUpdateModal()}>v{version}</span>
              </Badge>
            )}
          </div>
        )}
        <Button type="text" icon={collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />} onClick={() => setCollapsed(!collapsed)} className={styles.collapseBtn} />
      </div>
      <Menu mode="inline" selectedKeys={[selectedKey]} openKeys={openKeys} onOpenChange={(keys) => setOpenKeys(keys as string[])} onClick={({ key }) => {
          const path = KEY_TO_PATH[String(key)];
          if (path) navigate(path);
        }} items={menuItems} />
      <Modal open={updateModalOpen} onCancel={() => setUpdateModalOpen(false)} title={<h3 className={styles.updateModalTitle}>{t("sidebar.updateModal.title", { version: latestVersion })}</h3>} width={680}>
        <div className={styles.updateModalBody}><ReactMarkdown remarkPlugins={[remarkGfm]}>{updateMarkdown}</ReactMarkdown></div>
      </Modal>
    </Sider>
  );
}
