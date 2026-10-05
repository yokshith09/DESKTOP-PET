import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast:
            "!bg-popover !text-popover-foreground !border !border-border !rounded-xl !shadow-xl",
          actionButton: "!bg-primary !text-primary-foreground !font-semibold",
        },
      }}
      {...props}
    />
  );
}
