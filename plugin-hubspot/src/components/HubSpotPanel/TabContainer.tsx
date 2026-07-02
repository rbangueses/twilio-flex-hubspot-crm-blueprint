import { Tabs, TabList, Tab, TabPanels, TabPanel } from "@twilio-paste/core";
import { ReactNode } from "react";

interface TabItem {
  id: string;
  label: string;
  count?: number;
  loading?: boolean;
  content: ReactNode;
}

interface TabContainerProps {
  tabs: TabItem[];
}

export function TabContainer({ tabs }: TabContainerProps) {
  return (
    <Tabs>
      <TabList aria-label="HubSpot data tabs">
        {tabs.map((tab) => (
          <Tab key={tab.id} id={tab.id}>
            {tab.label}
            {tab.loading ? " ···" : tab.count !== undefined ? ` (${tab.count})` : ""}
          </Tab>
        ))}
      </TabList>
      <TabPanels>
        {tabs.map((tab) => (
          <TabPanel key={tab.id}>{tab.content}</TabPanel>
        ))}
      </TabPanels>
    </Tabs>
  );
}
