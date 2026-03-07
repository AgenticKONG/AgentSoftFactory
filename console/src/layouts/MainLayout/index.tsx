import { Layout } from "antd";
import { useEffect } from "react";
import { Routes, Route, useLocation, useNavigate, matchPath } from "react-router-dom";
import Sidebar from "../Sidebar";
import Header from "../Header";
import ConsoleCronBubble from "../../components/ConsoleCronBubble";
import styles from "../index.module.less";
import Chat from "../../pages/Chat";
import Workstation from "../../pages/Workstation";
import ProjectSetup from "../../pages/ProjectSetup";
import ProjectDashboard from "../../pages/ProjectDashboard";
import ProjectList from "../../pages/ProjectList";
import InfraCenter from "../../pages/InfraCenter";
import ChannelsPage from "../../pages/Control/Channels";
import SessionsPage from "../../pages/Control/Sessions";
import CronJobsPage from "../../pages/Control/CronJobs";
import HeartbeatPage from "../../pages/Control/Heartbeat";
import AgentConfigPage from "../../pages/Agent/Config";
import SkillsPage from "../../pages/Agent/Skills";
import WorkspacePage from "../../pages/Agent/Workspace";
import MCPPage from "../../pages/Agent/MCP";
import ModelsPage from "../../pages/Settings/Models";
import EnvironmentsPage from "../../pages/Settings/Environments";

const { Content } = Layout;

const pathToKey: Record<string, string> = {
  "/chat": "chat",
  "/infra-center": "infra-center",
  "/projects": "project-list",
  "/workstation": "workstation",
  "/project-setup": "project-setup",
  "/channels": "channels",
  "/sessions": "sessions",
  "/cron-jobs": "cron-jobs",
  "/heartbeat": "heartbeat",
  "/skills": "skills",
  "/mcp": "mcp",
  "/workspace": "workspace",
  "/agents": "agents",
  "/models": "models",
  "/environments": "environments",
  "/agent-config": "agent-config",
};

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  
  // Enhanced key matching for dynamic routes
  let selectedKey = pathToKey[currentPath] || "chat";
  if (matchPath("/projects/:id", currentPath)) {
    selectedKey = "project-list";
  }

  useEffect(() => {
    if (currentPath === "/") {
      navigate("/projects", { replace: true });
    }
  }, [currentPath, navigate]);

  return (
    <Layout className={styles.mainLayout}>
      <Sidebar selectedKey={selectedKey} />
      <Layout>
        <Header selectedKey={selectedKey} />
        <Content className="page-container">
          <ConsoleCronBubble />
          <div className="page-content">
            <Routes>
              <Route path="/chat" element={<Chat />} />
              <Route path="/infra-center" element={<InfraCenter />} />
              <Route path="/projects" element={<ProjectList />} />
              <Route path="/workstation" element={<Workstation />} />
              <Route path="/project-setup" element={<ProjectSetup />} />
              <Route path="/projects/:projectId" element={<ProjectDashboard />} />
              <Route path="/channels" element={<ChannelsPage />} />
              <Route path="/sessions" element={<SessionsPage />} />
              <Route path="/cron-jobs" element={<CronJobsPage />} />
              <Route path="/heartbeat" element={<HeartbeatPage />} />
              <Route path="/skills" element={<SkillsPage />} />
              <Route path="/mcp" element={<MCPPage />} />
              <Route path="/workspace" element={<WorkspacePage />} />
              <Route path="/models" element={<ModelsPage />} />
              <Route path="/environments" element={<EnvironmentsPage />} />
              <Route path="/agent-config" element={<AgentConfigPage />} />
              <Route path="/" element={<ProjectList />} />
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
