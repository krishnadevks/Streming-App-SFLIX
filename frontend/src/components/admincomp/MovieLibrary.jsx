import React, { useEffect, useState } from "react";
import axios from "axios";
import "./MovieLibrary.css";

const TMDB_API_KEY = "0c75992ce70c4ec0d89577f68c2b04cc";
const TMDB_API_URL = "https://api.themoviedb.org/3/movie/popular?api_key=" + TMDB_API_KEY;

function MovieLibrary() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await axios.get(TMDB_API_URL);
        setMovies(response.data.results);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching movies:", error);
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  return (
    <div className="movie-library">
      {loading ? (
        <p>Loading movies...</p>
      ) : (
        movies.map((movie) => (
          <div key={movie.id} className="movie-card">
            <img
              className="movie-card__image"
              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
              alt={movie.title}
            />
            <h3>{movie.title}</h3>
            <p>{movie.release_date}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default MovieLibrary;
