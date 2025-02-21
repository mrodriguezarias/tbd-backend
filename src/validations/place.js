import { Joi } from "express-validation"
import validationUtils from "../utils/validation"

const placeSchema = {
  id: Joi.string().custom(validationUtils.objectId),
  name: Joi.string().min(4).max(16),
  category: Joi.string().custom(validationUtils.objectId),
  longitude: Joi.number(),
  latitude: Joi.number(),
  safe: Joi.boolean().default(false),
}

const latLngSchema = Joi.object({
  latitude: Joi.number().required(),
  longitude: Joi.number().required(),
})

const placeValidation = {
  getPlace: {
    params: Joi.object({
      id: placeSchema.id.required(),
    }),
  },
  createPlace: {
    body: Joi.object({
      name: placeSchema.name.required(),
      category: placeSchema.category.required(),
      longitude: placeSchema.longitude.required(),
      latitude: placeSchema.latitude.required(),
      safe: placeSchema.safe,
    }),
  },
  updatePlace: {
    params: Joi.object({
      id: placeSchema.id.required(),
    }),
    body: Joi.object({
      id: placeSchema.id,
      name: placeSchema.name,
      category: placeSchema.category,
      longitude: placeSchema.longitude,
      latitude: placeSchema.latitude,
      safe: placeSchema.safe,
    }),
  },
  deletePlace: {
    params: Joi.object({
      id: placeSchema.id.required(),
    }),
  },
  searchPlaces: {
    body: Joi.object({
      query: Joi.string().required(),
      skip: Joi.number().integer().min(0).default(0),
      limit: Joi.number().integer().min(0).default(0),
    }),
  },
  locatePlaces: {
    body: Joi.object({
      bounds: Joi.object({
        northeast: latLngSchema.required(),
        southwest: latLngSchema.required(),
      }).required(),
    }),
  },
}

export default placeValidation
