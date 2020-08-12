/**
 * Para crear una ruta necesitamos de express pues es quien nos define el router
 */
const express = require("express");
const joi = require('@hapi/joi');
const MoviesServices = require('../services/movies');

const {
  movieIdSchema,
  createMovieSchema,
  updateMovieSchema

} = require('../utils/schemas/movies');

const validationHandler = require('../utils/middleware/validationHandler');

const cacheResponse = require('../utils/cacheResponse');
const { FIVE_MINUTES_IN_SECONDS, SIXTY_MINUTES_IN_SECONDS } = require('../utils/time');

/** vamos a recibir una aplicación de express, lo que nos permite ser dinamicos y obtener el control,
 * sobre que aplicación va a consumir nuestra ruta.
*/

function moviesApi(app) {
  // creamos el router
  const router = express.Router();
  // le decimos a la aplicación que le vamos a pasar como parametro le vamos a decir la ruta de inicio
  app.use("/api/movies", router)

  const moviesService = new MoviesServices();

  // Apartir de aqui lo que hacemos es alimentar el router con las otras rutas
  // Cuando se le asigna un get al home, y el home va a ser api/movies, que fue el que definimos arriba

  /* nos va a devolver las salidas, como estamos escribiendo código asincrono debemos usar la palabra
     clave async, recuerden que una ruta recibe el request, el response object y en este caso vamos a 
     recibir la funcionalidad next, esto hace parte de la teoria de middleware que vamos a explicar 
     más adelante
  */
  router.get("/", async function (req, res, next) {
      cacheResponse(res, FIVE_MINUTES_IN_SECONDS);
      const { tags } = req.query;
    // como es código asincron es muy importante utilizar el try catch
    try {
      // es importante que como nuestro codigo es un await debemos envolverlo
      // en una promesa para que puedamos hacer uso de nuestro código asincrono con la palabra await
      const movies = await moviesService.getMovies({ tags });
      // Usamos response, definimos el estatus, que como hablamos con anterioridad va a ser 200 de ok
      // definimos su estructura json
      res.status(200).json({
        data: movies,
        message: 'movies listed'
      })
    } catch (error) {
      next(error);
    }
  })

  // Obtener movie por id
  router.get("/:movieId", validationHandler(joi.object({ movieId: movieIdSchema }), 'params'), async function (req, res, next) {
    cacheResponse(res, SIXTY_MINUTES_IN_SECONDS);
    const { movieId } = req.params;
    try {
      const movies = await moviesService.getMovie({ movieId });

      res.status(200).json({
        data: movies,
        message: 'movie retrieved'
      })
    } catch (error) {
      next(error);
    }
  })

  // create
  router.post("/", validationHandler(joi.object(createMovieSchema)), async function (req, res, next) {
    const { body: movie } = req;
    try {
      const createdMovieId = await moviesService.createMovie({ movie });
      res.status(201).json({
        data: createdMovieId,
        message: 'movie created'
      })
    } catch (error) {
      next(error);
    }
  })

  // PUT - actualizar
  router.put("/:movieId", validationHandler(joi.object({ movieId: movieIdSchema }), 'params'), validationHandler(updateMovieSchema) ,async function (req, res, next) {
    const { movieId } = req.params;
    const { body: movie } = req;
    try {
      const updatedMovieId = await moviesService.updateMovie({ movieId, movie });
      res.status(200).json({
        data: updatedMovieId,
        message: 'movie updated'
      })
    } catch (error) {
      next(error);
    }
  })

  // delete
  router.delete("/:movieId", validationHandler(joi.object({ movieId: movieIdSchema }), 'params'), async function (req, res, next) {
    const { movieId } = req.params;
    try {
      const deleteMovieId = await moviesService.deleteMovie({ movieId });
      res.status(200).json({
        data: deleteMovieId,
        message: 'movies deleted'
      })
    } catch (error) {
      next(error);
    }
  })

}
// Ahora tenemos que exportarla, porque aquí estamos definiendo la ruta pero no la estamos usando
// en nuestra aplicación de express

  module.exports = moviesApi;