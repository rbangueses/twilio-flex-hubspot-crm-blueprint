import { useState, useMemo } from "react";
import {
  Box,
  Text,
  Button,
  Input,
  Label,
  Stack,
  Badge,
  Select,
  Option,
} from "@twilio-paste/core";
import { ChevronDownIcon } from "@twilio-paste/icons/esm/ChevronDownIcon";
import { ChevronUpIcon } from "@twilio-paste/icons/esm/ChevronUpIcon";
import { ChevronRightIcon } from "@twilio-paste/icons/esm/ChevronRightIcon";
import { Deal } from "../../types";
import { createDeal, updateDeal } from "../../api/hubspotClient";
import { LoadingState } from "../shared/LoadingState";
import { ErrorBanner } from "../shared/ErrorBanner";

const DEAL_STAGES = [
  { value: "appointmentscheduled", label: "Appointment Scheduled" },
  { value: "qualifiedtobuy", label: "Qualified to Buy" },
  { value: "presentationscheduled", label: "Presentation Scheduled" },
  { value: "decisionmakerboughtin", label: "Decision Maker Bought-In" },
  { value: "contractsent", label: "Contract Sent" },
  { value: "closedwon", label: "Closed Won" },
  { value: "closedlost", label: "Closed Lost" },
];

interface DealsTabProps {
  contactId: string;
  deals: Deal[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function DealsTab({
  contactId,
  deals,
  loading,
  error,
  onRefresh,
}: DealsTabProps) {
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dealname, setDealname] = useState("");
  const [amount, setAmount] = useState("");
  const [dealstage, setDealstage] = useState("appointmentscheduled");
  const [closedate, setClosedate] = useState("");

  const sortedDeals = useMemo(() => {
    return [...deals].sort((a, b) => {
      const aOpen = !a.dealstage.startsWith("closed");
      const bOpen = !b.dealstage.startsWith("closed");
      if (aOpen !== bOpen) return aOpen ? -1 : 1;
      return new Date(b.createdate).getTime() - new Date(a.createdate).getTime();
    });
  }, [deals]);

  const handleCreate = async () => {
    if (!dealname.trim()) return;
    setSaving(true);
    try {
      await createDeal({
        contactId,
        dealname,
        amount,
        dealstage,
      });
      setDealname("");
      setAmount("");
      setDealstage("appointmentscheduled");
      setClosedate("");
      setCreating(false);
      onRefresh();
    } catch (err) {
      console.error("Failed to create deal:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState text="Loading deals..." />;
  }

  if (error) {
    return <ErrorBanner message={error} onRetry={onRefresh} />;
  }

  return (
    <Box padding="space40">
      {creating ? (
        <Stack orientation="vertical" spacing="space40">
          <Box>
            <Label htmlFor="deal-name" required>
              Deal Name
            </Label>
            <Input
              id="deal-name"
              type="text"
              value={dealname}
              onChange={(e) => setDealname(e.target.value)}
            />
          </Box>
          <Box display="flex" columnGap="space40">
            <Box flex="1">
              <Label htmlFor="deal-amount">Amount</Label>
              <Input
                id="deal-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                insertBefore={<Text as="span" color="colorTextWeak">$</Text>}
              />
            </Box>
            <Box flex="1">
              <Label htmlFor="deal-closedate">Expected Close</Label>
              <Input
                id="deal-closedate"
                type="date"
                value={closedate}
                onChange={(e) => setClosedate(e.target.value)}
              />
            </Box>
          </Box>
          <Box>
            <Label htmlFor="deal-stage">Stage</Label>
            <Select
              id="deal-stage"
              value={dealstage}
              onChange={(e) => setDealstage(e.target.value)}
            >
              {DEAL_STAGES.map((stage) => (
                <Option key={stage.value} value={stage.value}>
                  {stage.label}
                </Option>
              ))}
            </Select>
          </Box>
          <Box display="flex" columnGap="space30">
            <Button
              variant="primary"
              onClick={handleCreate}
              loading={saving}
              disabled={!dealname.trim()}
            >
              Create Deal
            </Button>
            <Button variant="secondary" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </Box>
        </Stack>
      ) : (
        <>
          <Box marginBottom="space40">
            <Button variant="secondary" size="small" onClick={() => setCreating(true)}>
              + New Deal
            </Button>
          </Box>
          {sortedDeals.length === 0 ? (
            <Text as="p" color="colorTextWeak">
              No deals found
            </Text>
          ) : (
            <Stack orientation="vertical" spacing="space30">
              {sortedDeals.map((deal) => (
                <DealRow key={deal.id} deal={deal} onUpdate={onRefresh} />
              ))}
            </Stack>
          )}
        </>
      )}
    </Box>
  );
}

function DealRow({ deal, onUpdate }: { deal: Deal; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState(deal.dealname);
  const [editAmount, setEditAmount] = useState(deal.amount);
  const [editStage, setEditStage] = useState(deal.dealstage);
  const [editClosedate, setEditClosedate] = useState(
    deal.closedate ? deal.closedate.split("T")[0] : ""
  );

  const stageInfo = getStageInfo(deal.dealstage);
  const isClosed = deal.dealstage.startsWith("closed");
  const dealAge = getDealAge(deal.createdate);

  const formattedAmount = deal.amount
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
        Number(deal.amount)
      )
    : "—";

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDeal({
        dealId: deal.id,
        dealname: editName,
        amount: editAmount,
        dealstage: editStage,
        closedate: editClosedate || "",
      });
      setEditing(false);
      onUpdate();
    } catch (err) {
      console.error("Failed to update deal:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleMoveToNextStage = async () => {
    const currentIndex = DEAL_STAGES.findIndex((s) => s.value === deal.dealstage);
    if (currentIndex < 0 || currentIndex >= DEAL_STAGES.length - 2) return;

    const nextStage = DEAL_STAGES[currentIndex + 1].value;
    setSaving(true);
    try {
      await updateDeal({ dealId: deal.id, dealstage: nextStage });
      onUpdate();
    } catch (err) {
      console.error("Failed to move deal:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkWon = async () => {
    setSaving(true);
    try {
      await updateDeal({
        dealId: deal.id,
        dealstage: "closedwon",
        closedate: new Date().toISOString().split("T")[0],
      });
      onUpdate();
    } catch (err) {
      console.error("Failed to close deal:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkLost = async () => {
    setSaving(true);
    try {
      await updateDeal({
        dealId: deal.id,
        dealstage: "closedlost",
        closedate: new Date().toISOString().split("T")[0],
      });
      onUpdate();
    } catch (err) {
      console.error("Failed to close deal:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      borderWidth="borderWidth10"
      borderStyle="solid"
      borderColor="colorBorderWeaker"
      borderRadius="borderRadius20"
    >
      <Box
        padding="space30"
        cursor="pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" marginBottom="space20">
          <Box display="flex" alignItems="center" columnGap="space20" flex="1">
            {expanded ? (
              <ChevronUpIcon decorative size="sizeIcon20" />
            ) : (
              <ChevronDownIcon decorative size="sizeIcon20" />
            )}
            <Text as="span" fontWeight="fontWeightSemibold">
              {deal.dealname}
            </Text>
          </Box>
          <Box display="flex" alignItems="center" columnGap="space20">
            <Text as="span" fontWeight="fontWeightSemibold">
              {formattedAmount}
            </Text>
            <Badge as="span" variant={stageInfo.variant}>
              {stageInfo.label}
            </Badge>
          </Box>
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Text as="span" fontSize="fontSize20" color="colorTextWeak">
            #{deal.id}
          </Text>
          <Text as="span" fontSize="fontSize20" color="colorTextWeak">
            {dealAge}
          </Text>
        </Box>
      </Box>

      {expanded && (
        <Box
          padding="space40"
          borderTopWidth="borderWidth10"
          borderTopStyle="solid"
          borderTopColor="colorBorderWeaker"
          backgroundColor="colorBackgroundWeak"
        >
          {editing ? (
            <Stack orientation="vertical" spacing="space40">
              <Box>
                <Label htmlFor={`name-${deal.id}`}>Deal Name</Label>
                <Input
                  id={`name-${deal.id}`}
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </Box>
              <Box display="flex" columnGap="space40">
                <Box flex="1">
                  <Label htmlFor={`amount-${deal.id}`}>Amount</Label>
                  <Input
                    id={`amount-${deal.id}`}
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    insertBefore={<Text as="span" color="colorTextWeak">$</Text>}
                  />
                </Box>
                <Box flex="1">
                  <Label htmlFor={`closedate-${deal.id}`}>Expected Close</Label>
                  <Input
                    id={`closedate-${deal.id}`}
                    type="date"
                    value={editClosedate}
                    onChange={(e) => setEditClosedate(e.target.value)}
                  />
                </Box>
              </Box>
              <Box>
                <Label htmlFor={`stage-${deal.id}`}>Stage</Label>
                <Select
                  id={`stage-${deal.id}`}
                  value={editStage}
                  onChange={(e) => setEditStage(e.target.value)}
                >
                  {DEAL_STAGES.map((stage) => (
                    <Option key={stage.value} value={stage.value}>
                      {stage.label}
                    </Option>
                  ))}
                </Select>
              </Box>
              <Box display="flex" columnGap="space30">
                <Button
                  variant="primary"
                  size="small"
                  onClick={handleSave}
                  loading={saving}
                >
                  Save
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    setEditing(false);
                    setEditName(deal.dealname);
                    setEditAmount(deal.amount);
                    setEditStage(deal.dealstage);
                    setEditClosedate(deal.closedate ? deal.closedate.split("T")[0] : "");
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </Stack>
          ) : (
            <>
              <Box marginBottom="space30">
                <Text as="span" fontSize="fontSize20" color="colorTextWeak">
                  Stage
                </Text>
                <Box marginTop="space20">
                  <StageProgress currentStage={deal.dealstage} />
                </Box>
              </Box>
              <Box display="flex" columnGap="space50" marginBottom="space30">
                <Box>
                  <Text as="span" fontSize="fontSize20" color="colorTextWeak">
                    Created
                  </Text>
                  <Text as="p" marginTop="space10">
                    {new Date(deal.createdate).toLocaleDateString()}
                  </Text>
                </Box>
                <Box>
                  <Text as="span" fontSize="fontSize20" color="colorTextWeak">
                    Expected Close
                  </Text>
                  <Text as="p" marginTop="space10">
                    {deal.closedate
                      ? new Date(deal.closedate).toLocaleDateString()
                      : "Not set"}
                  </Text>
                </Box>
              </Box>
              <Box display="flex" columnGap="space30" flexWrap="wrap" rowGap="space20">
                <Button variant="secondary" size="small" onClick={() => setEditing(true)}>
                  Edit Deal
                </Button>
                {!isClosed && (
                  <>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={handleMoveToNextStage}
                      loading={saving}
                    >
                      Next Stage <ChevronRightIcon decorative size="sizeIcon20" />
                    </Button>
                    <Button
                      variant="primary"
                      size="small"
                      onClick={handleMarkWon}
                      loading={saving}
                    >
                      Mark Won
                    </Button>
                    <Button
                      variant="destructive_secondary"
                      size="small"
                      onClick={handleMarkLost}
                      loading={saving}
                    >
                      Mark Lost
                    </Button>
                  </>
                )}
              </Box>
            </>
          )}
        </Box>
      )}
    </Box>
  );
}

function StageProgress({ currentStage }: { currentStage: string }) {
  const currentIndex = DEAL_STAGES.findIndex((s) => s.value === currentStage);
  const isClosed = currentStage.startsWith("closed");
  const isWon = currentStage === "closedwon";

  return (
    <Box display="flex" alignItems="center" columnGap="space10">
      {DEAL_STAGES.slice(0, -2).map((stage, index) => {
        const isActive = index === currentIndex;
        const isPast = index < currentIndex && !isClosed;
        const bgColor = isActive
          ? "colorBackgroundPrimaryStronger"
          : isPast
          ? "colorBackgroundPrimaryStrong"
          : "colorBackgroundStrong";

        return (
          <Box
            key={stage.value}
            flex="1"
            height="8px"
            backgroundColor={bgColor}
            borderRadius="borderRadiusPill"
            title={stage.label}
          />
        );
      })}
      {isClosed && (
        <Badge as="span" variant={isWon ? "success" : "error"}>
          {isWon ? "Won" : "Lost"}
        </Badge>
      )}
    </Box>
  );
}

function getStageInfo(stage: string): { label: string; variant: "success" | "error" | "warning" | "info" | "default" } {
  const stageObj = DEAL_STAGES.find((s) => s.value === stage);
  const label = stageObj?.label || stage;

  if (stage === "closedwon") return { label, variant: "success" };
  if (stage === "closedlost") return { label, variant: "error" };
  if (stage === "contractsent") return { label, variant: "warning" };
  if (stage === "decisionmakerboughtin") return { label, variant: "info" };
  return { label, variant: "default" };
}

function getDealAge(createdate: string): string {
  const created = new Date(createdate);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - created.getTime()) / 86400000);

  if (diffDays === 0) return "Created today";
  if (diffDays === 1) return "1 day old";
  if (diffDays < 30) return `${diffDays} days old`;
  if (diffDays < 60) return "1 month old";
  return `${Math.floor(diffDays / 30)} months old`;
}
