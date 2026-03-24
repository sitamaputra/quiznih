import {
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
  ACTIONS_CORS_HEADERS,
} from "@solana/actions";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  clusterApiUrl,
} from "@solana/web3.js";

export const GET = async (req: Request) => {
  const payload: ActionGetResponse = {
    icon: "https://quiznih.vercel.app/quiz-thumb.png", // Replace with real URL later
    title: "Quiznih - Solana Quiz Challenge",
    description: "Answer a trivia question to win SOL rewards! Entry fee: 0.01 SOL.",
    label: "Pay & Start Quiz",
    links: {
      actions: [
        {
          type: "transaction",
          label: "0.01 SOL Entry",
          href: "/api/actions/quiz?amount=0.01",
        },
        {
          type: "transaction",
          label: "0.05 SOL Pro Entry",
          href: "/api/actions/quiz?amount=0.05",
        }
      ],
    },
  };

  return Response.json(payload, {
    headers: ACTIONS_CORS_HEADERS,
  });
};

export const OPTIONS = GET;

export const POST = async (req: Request) => {
  try {
    const url = new URL(req.url);
    const amount = url.searchParams.get("amount") || "0.01";
    const body: ActionPostRequest = await req.json();

    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch (err) {
      return new Response('Invalid "account" provided', {
        status: 400,
        headers: ACTIONS_CORS_HEADERS,
      });
    }

    const connection = new Connection(clusterApiUrl("devnet"));
    const transaction = new Transaction();

    // Destination wallet (Your treasury wallet) - Use a dummy for demo
    const treasury = new PublicKey("Hk...Zq2"); // Replace with real one

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: account,
        toPubkey: treasury,
        lamports: Number(amount) * 1_000_000_000,
      })
    );

    // Set recent blockhash and fee payer
    transaction.feePayer = account;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    const payload: ActionPostResponse = {
      type: "transaction",
      transaction: transaction
        .serialize({ requireAllSignatures: false })
        .toString("base64"),
      message: `Successfully paid ${amount} SOL entry fee for Quiznih!`,
    };

    return Response.json(payload, {
      headers: ACTIONS_CORS_HEADERS,
    });
  } catch (err) {
    return new Response("Internal Server Error", {
      status: 500,
      headers: ACTIONS_CORS_HEADERS,
    });
  }
};
