import { useEffect, useState } from "react";
import Fireworks from "react-canvas-confetti/dist/presets/fireworks";
import Papa from "papaparse";
import { FixedSizeList as List } from "react-window";
// Define the types for user data

import "./App.css";
import logo from "./assets/logo-light.png";
import { Button } from "./components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./components/ui/popover";
import { Settings2, Trash2, Upload, Users2 } from "lucide-react";
import { Label } from "./components/ui/label";
import { Input } from "./components/ui/input";
import { Separator } from "./components/ui/separator";
import { cn } from "./lib/utils";

interface User {
  name: string;
  email: string;
  phone: string;
  institutionType: string;
  institution: string;
  totalScore: number;
}

const getRandomWinner = (users: User[]): User => {
  const totalScore = users.reduce((acc, user) => acc + user.totalScore, 0);
  const random = Math.random() * totalScore;
  let cumulativeScore = 0;

  for (const user of users) {
    cumulativeScore += user.totalScore;
    if (random < cumulativeScore) {
      return user;
    }
  }
  return users[0]; // Fallback, should not happen
};

const UserList: React.FC<{ users: User[] }> = ({ users }) => {
  // Function to render each row in the virtualized list
  const Row = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    const user = users[index];
    return (
      <div
        style={style}
        className={cn(
          "flex items-center px-4",
          index % 2 === 0 ? "bg-accent" : ""
        )}
      >
        <div className="grid gap-1">
          <p className="font-semibold leading-none">{user.name}</p>
          <p className="leading-none text-sm text-muted-foreground">
            {user.institution || "-"}
          </p>
        </div>
      </div>
    );
  };

  return (
    <List
      height={400} // Set the height of the list container (e.g., 400px)
      itemCount={users.length} // Number of users to render
      itemSize={60} // Height of each item in the list (35px)
      width={"100%"} // Width of the list (you can adjust this)
      className="space-y-2"
    >
      {Row}
    </List>
  );
};

type AppState = "idle" | "draw" | "result";

function App() {
  const [state, setState] = useState<AppState>("idle");
  const [countdown, setCountdown] = useState(5);
  const [loopIndex, setLoopIndex] = useState(0); // to loop through users' names
  const [winner, setWinner] = useState<User | null>(null);
  const [winners, setWinners] = useState<User[]>([]);
  const [title, setTitle] = useState("Undian Pemenang Doorprize INAHEF 2024");
  const [users, setUsers] = useState<User[]>([]);

  // Load winners from localStorage when the app starts
  useEffect(() => {
    const savedWinners = localStorage.getItem("winners");
    if (savedWinners) {
      setWinners(JSON.parse(savedWinners));
    }
  }, []);

  useEffect(() => {
    if (winners.length > 0) {
      localStorage.setItem("winners", JSON.stringify(winners));
    }
  }, [winners]);

  useEffect(() => {
    let countdownTimer: NodeJS.Timeout | undefined;
    let nameLoopTimer: NodeJS.Timeout | undefined;

    // If state is "draw", start the countdown and loop through users
    if (state === "draw") {
      // Countdown logic
      if (countdown > 0) {
        countdownTimer = setInterval(() => {
          setCountdown((prevCountdown) => prevCountdown - 1);
        }, 1000);

        nameLoopTimer = setInterval(() => {
          setLoopIndex((prevIndex) => (prevIndex + 1) % users.length);
        }, 50);
      } else {
        // After countdown finishes, set the winner and move to "result" state
        const availableUsers = users.filter((user) => !winners.includes(user)); // Exclude previous winners
        if (availableUsers.length > 0) {
          const randomWinner = getRandomWinner(availableUsers);
          setWinner(randomWinner);
          setWinners((prevWinners) => [...prevWinners, randomWinner]); // Add winner to list
          setState("result");
        }
      }
    }

    return () => {
      clearInterval(countdownTimer);
      clearInterval(nameLoopTimer);
    };
  }, [state, countdown, winners, users]);

  const clearWinners = () => {
    const confirmed = window.confirm(
      "Are you sure you want to clear all winners?"
    );
    if (confirmed) {
      setWinners([]);
      setWinner(null);
      setState("idle");
      localStorage.removeItem("winners");
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const csvData = e.target?.result;
      if (typeof csvData === "string") {
        Papa.parse(csvData, {
          header: true,
          complete: (results) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const parsedUsers: User[] = results.data.map((item: any) => ({
              name: item.Name,
              email: item.Email,
              phone: item.Phone,
              institution: item["Institution Type"],
              institutionType: item.institution,
              totalScore: Number(item["Total Score"]),
            }));
            setUsers(parsedUsers);
          },
        });
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="flex h-screen">
      <div className="flex-1 place-content-center relative bg-accent">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="absolute top-2 left-2"
              // size="icon"
            >
              <Settings2 className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[400px]">
            <h2 className="font-semibold text-sm">Settings</h2>
            <Separator className="my-2" />
            <div className="flex gap-2 items-center">
              <Label className="w-24">Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="absolute bottom-2 left-2"
              // size="icon"
            >
              <Upload className="w-4 h-4 mr-2" />
              Users
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[450px]">
            <h2 className="font-semibold text-sm">Users</h2>
            <Separator className="my-2" />
            {/* File input to upload the CSV */}
            <div className="flex gap-2 items-center">
              <Label className="whitespace-nowrap">Import users</Label>
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="h-8"
              />
            </div>
            <Separator className="my-2" />
            {users.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-20 text-muted-foreground">
                <Users2 className="w-8 h-8" strokeWidth={1} />
                <p className="text-sm">No users</p>
              </div>
            )}

            {/* Display the users list with react-window if there are users */}
            {users.length > 0 && (
              <div className="py-6">
                <h2 className="font-semibold mb-2">
                  Users List ({users.length})
                </h2>
                <UserList users={users} />
              </div>
            )}
          </PopoverContent>
        </Popover>

        <div className="flex flex-col items-center gap-2">
          <img src={logo} alt="logo" className="w-28 h-28" />
          <h1 className="text-3xl font-semibold text-center">{title}</h1>
          <div className="flex justify-center mt-12 h-40">
            {state === "draw" && (
              <div className="flex flex-col gap-4 items-center">
                {/* <TextLoop animation="keyframes" timeout={200}>
             {users.map((user) => (
               <span key={user.id} className="text-5xl font-semibold">
                 {user.name}
               </span>
             ))}
             <p>{countdown}</p>
           </TextLoop> */}
                <h1 className="text-2xl">
                  Drawing... <span className="font-bold">{countdown}</span>{" "}
                  seconds left
                </h1>
                <h2 className="text-5xl font-semibold">
                  {users[loopIndex].name}
                </h2>
              </div>
            )}
            {state === "idle" && (
              <Button
                className="px-8 text-xl h-14"
                onClick={() => {
                  setState("draw");
                }}
                disabled={users.length === 0}
              >
                Draw
              </Button>
            )}
            {state === "result" && (
              <div className="flex flex-col gap-10 items-center">
                <Fireworks autorun={{ delay: 0.2, speed: 3, duration: 2000 }} />
                <div className="flex gap-4 items-center flex-col">
                  <p className="text-2xl font-semibold">The Winner is</p>
                  <h1 className="text-5xl font-semibold">
                    🎉 {winner?.name} 🎉
                  </h1>
                </div>
                <Button
                  className="px-8 text-xl h-14"
                  onClick={() => {
                    setCountdown(5);
                    setLoopIndex(0);
                    setState("draw");
                  }}
                  disabled={users.length === 0}
                >
                  Draw Again
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="w-[400px] border-l">
        <div className="flex items-center justify-between h-16 px-4">
          <h2 className="text-lg font-semibold">🎉 Winners 🎉</h2>
          <Button variant="outline" onClick={clearWinners}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
        <Separator />
        {winners.length === 0 && (
          <div className="flex items-center justify-center h-[600px]">
            <p className="text-muted-foreground">No winners</p>
          </div>
        )}
        <ul className="space-y-2 p-6">
          {winners.map((w, i) => (
            <li
              key={w.name}
              className="text-lg font-semibold flex gap-3 items-center"
            >
              <div className="h-8 w-8 flex items-center justify-center bg-primary text-primary-foreground rounded-lg">
                {i + 1}
              </div>{" "}
              {w.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
