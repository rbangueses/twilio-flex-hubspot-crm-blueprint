import { Box, SkeletonLoader, Spinner, Text } from "@twilio-paste/core";

interface LoadingStateProps {
  variant?: "skeleton" | "spinner";
  text?: string;
}

export function LoadingState({ variant = "spinner", text }: LoadingStateProps) {
  if (variant === "skeleton") {
    return (
      <Box padding="space40">
        <SkeletonLoader height="20px" width="60%" />
        <Box marginTop="space30">
          <SkeletonLoader height="16px" width="40%" />
        </Box>
        <Box marginTop="space30">
          <SkeletonLoader height="16px" width="80%" />
        </Box>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      padding="space60"
    >
      <Spinner decorative size="sizeIcon60" />
      {text && (
        <Text as="span" marginLeft="space30" color="colorTextWeak">
          {text}
        </Text>
      )}
    </Box>
  );
}
