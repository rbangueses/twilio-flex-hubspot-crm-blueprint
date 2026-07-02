import * as Flex from "@twilio/flex-ui";
import { FlexPlugin } from "@twilio/flex-plugin";
import { CustomizationProvider } from "@twilio-paste/core/customization";
import { HubSpotPanel } from "./components/HubSpotPanel";

const PLUGIN_NAME = "HubSpotPlugin";

export default class HubSpotPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  async init(flex: typeof Flex, manager: Flex.Manager): Promise<void> {
    // Disable default CRM iframe by returning empty string
    flex.CRMContainer.defaultProps.uriCallback = () => "";

    flex.CRMContainer.Content.replace(
      <HubSpotCRMPanel key="hubspot-crm-panel" />,
      { sortOrder: 0 }
    );
  }
}

function HubSpotCRMPanel() {
  const task = Flex.useFlexSelector(
    (state) => state.flex.view.selectedTaskSid
  );
  const tasks = Flex.useFlexSelector((state) => state.flex.worker.tasks);

  let phone: string | null = null;

  if (task && tasks.has(task)) {
    const taskData = tasks.get(task);
    const attributes = taskData?.attributes as Record<string, unknown> | undefined;
    const direction = attributes?.direction as string | undefined;

    if (direction === "outbound") {
      // Outbound call: use destination/outbound_to/to
      phone = (attributes?.outbound_to as string) ||
              (attributes?.destination as string) ||
              (attributes?.to as string) ||
              (attributes?.name as string) ||
              null;
    } else {
      // Inbound call: use from/caller
      phone = (attributes?.from as string) || (attributes?.caller as string) || null;
    }
  }

  return (
    <CustomizationProvider baseTheme="default">
      <HubSpotPanel phone={phone} />
    </CustomizationProvider>
  );
}
