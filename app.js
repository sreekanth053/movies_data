const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "moviesData.db");

const app = express();

app.use(express.json());

let database = null;

const initializeServerAndDb = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server is Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeServerAndDb();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
SELECT
  movie_name
FROM
  movie;`;
  const moviesArray = await database.all(getMoviesQuery);
  response.send(
    moviesArray.map((eachMovie) => convertDbObjectToResponseObject(eachMovie))
  );
});

app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const postMovieQuery = `
INSERT INTO
  movie (director_id, movie_name, lead_actor)
VALUES
('${directorId}', '${movieName}', '${leadActor}');`;
  const movie = await database.run(postMovieQuery);
  response.send("Movie Successfully Added");
});

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
SELECT
  *
FROM
  movie
WHERE
  movie_id = ${movieId};`;
  const movie = await database.get(getMovieQuery);
  response.send(convertDbObjectToResponseObject(movie));
});

app.put("/movies/:movieId/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const { movieId } = request.params;
  const updateMovieQuery = `
UPDATE
  movie
SET
  director_id = ${directorId},
  movie_name = '${movieName}',
  lead_actor = '${leadActor}'
WHERE
  movie_id = ${movieId};`;

  await database.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
DELETE FROM
  movie
WHERE
  movie_id = ${movieId};`;
  await database.run(deleteMovieQuery);
  response.send("Movie Removed");
});

const convertDbObjToResObj = (dbObj) => {
  return {
    directorId: dbObj.director_id,
    directorName: dbObj.director_name,
  };
};

app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `
SELECT
  director_id,director_name
FROM
  director;`;
  const directorArray = await database.all(getDirectorsQuery);
  response.send(
    directorArray.map((eachDirector) => convertDbObjToResObj(eachDirector))
  );
});

const conDbObjToResObj = (dbOb) => {
  return {
    movieName: dbOb.movie_name,
  };
};

app.get("/directors/:directorId/movies", async (request, response) => {
  const getDirectorsDirectorIdMoviesQuery = `
SELECT
  movie_name
FROM
  movie JOIN director ON director.director_id=movie.director_id 
GROUP BY
  movie_name
HAVING 
  director_id=${directorId};`;
  const directorIdMoviesArray = await database.all(
    getDirectorsDirectorIdMoviesQuery
  );
  response.send(
    directorIdMoviesArray.map((eachDirectorIdMovie) =>
      conDbObjToResObj(eachDirectorIdMovie)
    )
  );
});

module.exports = app;
