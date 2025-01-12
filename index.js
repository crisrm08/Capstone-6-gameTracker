import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "Games",
    password: "Pichipiu2020",
    port: 5432,
    });
    
db.connect();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
    try {
        const getGames = await db.query("SELECT * FROM playedgames");
        const games = getGames.rows; 
        res.render("index.ejs", { games: games });
    } catch (error) {
        console.error("Error fetching games:", error);
        res.status(500).send("Error loading page");
    }
});

let games = [];
app.get("/getGame", async (req, res) => {
    try {
        const typedGame = req.query.input;
        const response = await axios.get("https://api.rawg.io/api/games?key=ed51885f7aac4caab4b5d7d88ab7b714");
        const results = response.data.results;
        const foundGame = results.find(g => g.name.toLowerCase().includes(typedGame.toLowerCase()));

        if (!foundGame) {
            return res.status(404).send("Game not found");
        }

        const game = {
            game_name: foundGame.name,
            game_image: foundGame.background_image,
            last_time_played: new Date(),
            ratings: 'Decent'
        };

        games.push(game);

        const today = new Date();
        const formattedDate = today.getFullYear() + '-' 
            + String(today.getMonth() + 1).padStart(2, '0') + '-' 
            + String(today.getDate()).padStart(2, '0');

        res.render("index.ejs", { games: games, formattedDate: formattedDate });
        games = [];
    } catch (error) {
        //console.error("Error fetching game:", error);
        const notFound = error
        res.render("index.ejs", {notFound: notFound});
    }
});

app.post("/saveGame", async (req, res) => {
    const name = req.body.game_name;
    const image = req.body.game_image;
    const rating = req.body.ratings;
    const lastPlayed = req.body.last_time_played;

    db.query("INSERT INTO playedgames (game_name, game_image, ratings, last_time_played) VALUES ($1, $2, $3, $4)", [name, image, rating, lastPlayed]);
    res.redirect("/");
});

app.post("/deleteGame", async (req,res) => {
    const name = req.body.game_name;
    db.query("DELETE FROM playedgames WHERE game_name = $1",[name]);
    res.redirect("/");
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});