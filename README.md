# MTG Bulk Buddy

MTG Bulk Buddy is a full-stack web application built to help Magic: The Gathering (MTG) players efficiently manage their card collections and decks. Designed with casual and competitive players in mind, the platform offers powerful tools for organizing, searching, building, and analyzing physical card collections.

This project was developed as part of my final-year Computing Science project at Ulster University (COM668).
Project Overview

Magic: The Gathering players often rely on spreadsheets or incomplete tools for managing their physical cards. MTG Bulk Buddy solves this problem by providing:

     Secure user authentication (JWT)

     Card data import from Scryfall API

     Collection management with quantity tracking

     Deck building with ownership tracking and format validation

     Powerful search and filtering (by name, type, color, set, rarity)

     Deck analysis tools (mana curve, missing cards, CSV/Text export)

     Responsive UI built with Tailwind CSS and Angular

## Tech Stack
Layer	Technology
Frontend	Angular, Tailwind CSS
Backend	Node.js, Express.js
Database	MongoDB (with Mongoose)
Auth	JWT, bcrypt
External	Scryfall API
Testing	Postman, Jasmine, Manual
Key Features

    Scryfall API Integration
    Automatically fetch card data by name and set, and import it into your local database on demand.

    Collection Management
    Add, update, and delete cards in your personal collection. Tracks quantity, acquisition date, and notes.

    Deck Building
    Create and manage decks, assign cards, view owned vs missing cards, and export decklists.

    Mana Curve Analysis
    Visual breakdown of deck mana cost for performance tuning.

    Public/Private Decks
    Choose whether your deck is shareable or kept private.

    Data Export
    Export your collections and decklists as .txt or .csv for backup or third-party use.

## Repository Structure

/backend
  /routes
    auth.js
    cards.js
    collections.js
    decks.js
  /models
  server.js

/frontend
  /src
    /app
      components/
      pages/
      services/
      
## Academic Context

This project was submitted as part of the COM668 Computing Project module at Ulster University. It demonstrates real-world application of:

    Agile development methodology

    RESTful API design

    NoSQL data modeling

    Secure full-stack web development

    External API integration

    Usability & UX design principles
