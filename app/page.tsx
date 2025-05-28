import Image from "next/image";
import Deck from './components/Deck';

export default function Home() {
  return (
      <div className="App" style={{padding: '100px'}}>
      <Deck />
    </div>
  );
}
