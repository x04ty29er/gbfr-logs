import "./Logs.css";

import { AppShell, Box, Burger, Group, NavLink, Text, Fieldset, Select, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Gear, House } from "@phosphor-icons/react";
import { invoke } from "@tauri-apps/api";
import { Link, Outlet } from "react-router-dom";
import { create } from "zustand";
import toast, { Toaster } from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { EncounterState, EnemyType } from "../types";
import { SUPPORTED_LANGUAGES } from "../i18n";

export interface SearchResult {
  logs: Log[];
  page: number;
  pageCount: number;
  logCount: number;
}

interface Log {
  id: number;
  name: string;
  time: number;
  duration: number;
}

interface LogIndexState {
  currentPage: number;
  searchResult: SearchResult;
  selectedLogIds: number[];
  setSearchResult: (result: SearchResult) => void;
  setCurrentPage: (page: number) => void;
  setSelectedLogIds: (ids: number[]) => void;
  deleteSelectedLogs: () => void;
  deleteAllLogs: () => void;
}

export const useLogIndexStore = create<LogIndexState>((set, get) => ({
  currentPage: 1,
  searchResult: { logs: [], page: 1, pageCount: 0, logCount: 0 },
  selectedLogIds: [],
  setCurrentPage: (page: number) => set({ currentPage: page }),
  setSearchResult: (result) => set({ searchResult: result }),
  setSelectedLogIds: (ids) => set({ selectedLogIds: ids }),
  deleteSelectedLogs: async () => {
    const { setSearchResult, selectedLogIds: ids } = get();

    try {
      await invoke("delete_logs", { ids });
      set({ currentPage: 1, selectedLogIds: [], searchResult: { logs: [], page: 1, pageCount: 0, logCount: 0 } });
      toast.success("Logs deleted successfully.");
      const result = await invoke("fetch_logs");
      setSearchResult(result as SearchResult);
    } catch (e) {
      toast.error(`Failed to delete logs: ${e}`);
    }
  },
  deleteAllLogs: async () => {
    const { setSearchResult } = get();

    try {
      await invoke("delete_all_logs");
      set({ currentPage: 1, selectedLogIds: [], searchResult: { logs: [], page: 1, pageCount: 0, logCount: 0 } });
      toast.success("Logs deleted successfully.");
      const result = await invoke("fetch_logs");
      setSearchResult(result as SearchResult);
    } catch (e) {
      toast.error(`Failed to delete logs: ${e}`);
    }
  },
}));

interface EncounterStore {
  encounterState: EncounterState | null;
  dpsChart: Record<number, number[]>;
  chartLen: number;
  targets: EnemyType[];
  selectedTargets: EnemyType[];
  setSelectedTargets: (targets: EnemyType[]) => void;
  loadFromResponse: (response: EncounterStateResponse) => void;
}

export interface EncounterStateResponse {
  encounterState: EncounterState;
  dpsChart: Record<number, number[]>;
  chartLen: number;
  targets: EnemyType[];
}

export const useEncounterStore = create<EncounterStore>((set) => ({
  encounterState: null,
  dpsChart: {},
  chartLen: 0,
  targets: [],
  selectedTargets: [],
  setSelectedTargets: (targets: EnemyType[]) => set({ selectedTargets: targets }),
  loadFromResponse: (response: EncounterStateResponse) =>
    set({
      encounterState: response.encounterState,
      dpsChart: response.dpsChart,
      chartLen: response.chartLen,
      targets: response.targets,
    }),
}));

const SettingsPage = () => {
  const { t, i18n } = useTranslation();
  const languages = Object.keys(SUPPORTED_LANGUAGES).map((key) => ({ value: key, label: SUPPORTED_LANGUAGES[key] }));

  const handleLanguageChange = (language: string | null) => {
    i18n.changeLanguage(language as string);
  };

  return (
    <Box>
      <Fieldset legend={t("ui.meter-settings")}>
        <Stack>
          <Text size="sm">{t("ui.language")}</Text>
          <Select data={languages} defaultValue={i18n.language} allowDeselect={false} onChange={handleLanguageChange} />
        </Stack>
      </Fieldset>
    </Box>
  );
};

const Layout = () => {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

  return (
    <div className="log-window">
      <AppShell
        header={{ height: 50 }}
        navbar={{
          width: 300,
          breakpoint: "sm",
          collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
        }}
        padding="sm"
      >
        <AppShell.Header>
          <Group h="100%" px="sm">
            <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
            <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="sm" size="sm" />
            <Text>GBFR Logs</Text>
          </Group>
        </AppShell.Header>
        <AppShell.Navbar p="sm">
          <AppShell.Section grow>
            <NavLink label="Logs" leftSection={<House size="1rem" />} component={Link} to="/logs" />
          </AppShell.Section>
          <AppShell.Section>
            <NavLink label="Settings" leftSection={<Gear size="1rem" />} component={Link} to="/logs/settings" />
          </AppShell.Section>
        </AppShell.Navbar>
        <AppShell.Main>
          <Outlet />
        </AppShell.Main>
      </AppShell>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            borderRadius: "10px",
            backgroundColor: "#252525",
            color: "#fff",
            fontSize: "14px",
          },
        }}
      />
    </div>
  );
};

export { SettingsPage };

export default Layout;
