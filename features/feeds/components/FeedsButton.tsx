type FeedButtonProps = {
  label: "CONNECT" | "DISCONNECT";
  onClick: () => void;
  disabled: boolean;
  active: boolean;
};

export default function FeedsButton({ label, onClick, disabled, active }: FeedButtonProps) {
  const variant = label.toLowerCase();

  return (
    <button
      className={`feeds-button feeds-button--${variant}${active ? " feeds-button--active" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}
