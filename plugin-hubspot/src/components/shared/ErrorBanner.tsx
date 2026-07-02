import { Alert, Button, Box } from "@twilio-paste/core";

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <Box padding="space40">
      <Alert variant="error">
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          width="100%"
        >
          <span>{message}</span>
          {onRetry && (
            <Button variant="link" size="small" onClick={onRetry}>
              Retry
            </Button>
          )}
        </Box>
      </Alert>
    </Box>
  );
}
