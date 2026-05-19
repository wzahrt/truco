interface Card {
  id: string;
  rank: string;
  suit: string;
}

interface CardViewProps {
  card: Card;
  hidden?: boolean;
  compact?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

const rankMap: Record<string, string> = {
  ACE: "ace",
  KING: "king",
  QUEEN: "queen",
  JACK: "jack",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7"
};

const suitMap: Record<string, string> = {
  HEARTS: "hearts",
  SPADES: "spades",
  DIAMONDS: "diamonds",
  CLUBS: "clubs"
};

export default function CardView({
  card,
  hidden,
  compact,
  onClick,
  disabled
}: CardViewProps) {
  const sizeClass = compact
    ? "h-24 w-16"
    : "h-40 w-28";

  const imagePath = hidden
    ? "/backs/RedCardBack.png"
    : `/fronts/${rankMap[card.rank]}_of_${suitMap[card.suit]}.svg`;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="transition duration-150 hover:-translate-y-1 hover:scale-105 disabled:opacity-60"
    >
      <img
        src={imagePath}
        alt={`${card.rank} of ${card.suit}`}
        className={`${sizeClass} rounded-xl shadow-xl`}
      />
    </button>
  );
}