import React from "react";
import Nav from "./Navhome";
import Viewers from "./Viewers";
import "./Home.css";
import Banner from "./Banner";

function Home() {
  return (
    <div className="home-page">
      <Nav />
      <Banner />
      <div className="home-rows">
       
      
      <Viewers /></div>
    </div>
  );
}

export default Home;