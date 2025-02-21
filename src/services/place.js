import HttpStatus from "http-status-codes"
import placeModel from "../models/place"
import HttpError from "../errors/http"
import dbUtils from "../utils/db"
import _ from "lodash"
import geoUtils from "../utils/geo"
import sectionService from "../services/section"
import sectionModel from "../models/section"
import mongoose from "mongoose"

const transformPlace = async (place) => {
  const capacity = await placeService.getCapacity(place.id)
  const occupation = await placeService.getOccupation(place.id)
  place = place.toJSON()
  place = {
    ...place,
    capacity,
    occupation,
  }
  return place
}

const transformPlaces = async (places) => {
  let transformed = []
  for (let place of places) {
    place = await transformPlace(place)
    transformed = [...transformed, place]
  }
  return transformed
}

const placeService = {
  getPlaces: async ({ filter = {}, skip, limit } = {}) => {
    const query = placeModel.find(filter)
    const count = await placeModel.count(filter)
    let data = await dbUtils.paginate(query, { skip, limit })
    data = await transformPlaces(data)
    return {
      data,
      count,
    }
  },
  getPlaceById: async (id) => {
    let place = await placeModel.findById(id)
    if (!place) {
      throw new HttpError(HttpStatus.NOT_FOUND, "Place not found")
    }
    place = await transformPlace(place)
    return place
  },
  createPlace: async (data) => {
    if (_.isEmpty(data)) {
      throw new HttpError(HttpStatus.BAD_REQUEST, "Place not provided")
    }
    data = dbUtils.toDocWithLocation(data)
    const place = await placeModel.create({
      ...data,
    })
    return transformPlace(place)
  },
  updatePlace: async (id, data) => {
    if (_.isEmpty(data)) {
      throw new HttpError(HttpStatus.BAD_REQUEST, "Place not provided")
    }

    const place = await placeModel.findById(id)
    if (!place) {
      throw new HttpError(HttpStatus.NOT_FOUND, "Place not found")
    }

    data = dbUtils.toDocWithLocation(data)
    const updatedPlace = await placeModel.findByIdAndUpdate(
      id,
      {
        ...data,
      },
      { new: true },
    )
    if (!updatedPlace) {
      throw new HttpError(HttpStatus.NOT_FOUND, "Place not found")
    }
    return transformPlace(updatedPlace)
  },
  deletePlace: async (id) => {
    const place = await placeModel.findByIdAndRemove(id)
    if (!place) {
      throw new HttpError(HttpStatus.NOT_FOUND, "Place not found")
    }
    return transformPlace(place)
  },
  deleteAllPlaces: async () => {
    const count = await placeModel.count({})
    if (count > 0) {
      await placeModel.collection.drop()
    }
  },
  searchPlaces: async (search, { skip = 0, limit = 0 } = {}) => {
    search = new RegExp(`${search}`, "i")
    const query = placeModel.find({
      $or: [{ name: search }, { category: search }, { address: search }],
    })
    let data = await dbUtils.paginate(query, { skip, limit, maxLimit: 50 })
    data = await transformPlaces(data)
    return data
  },
  locatePlaces: async (bounds) => {
    const { northeast, southwest } = bounds
    const distance = geoUtils.getDistance(northeast, southwest)
    if (distance > 3000) {
      return []
    }
    let places = await placeModel.find({
      location: {
        $geoWithin: {
          $box: [
            [southwest.longitude, southwest.latitude],
            [northeast.longitude, northeast.latitude],
          ],
        },
      },
    })
    places = _.sampleSize(places, 50)
    places = await transformPlaces(places)
    return places
  },
  getCapacity: async (placeId) => {
    const [{ total }] = await sectionModel.aggregate([
      { $match: { place: mongoose.Types.ObjectId(placeId) } },
      {
        $group: {
          _id: null,
          total: { $sum: `$capacity` },
        },
      },
    ])
    return total
  },
  getOccupation: async (placeId) => {
    const sections = await sectionService.getSectionsForPlace(placeId)
    return _.sum(sections.map(({ occupation }) => occupation))
  },
}

export default placeService
