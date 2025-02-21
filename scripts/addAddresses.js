import _ from "lodash"
import dbUtils from "../src/utils/db"
import placeService from "../src/services/place"
import consoleUtils from "../src/utils/console"
import requestUtils from "../src/utils/request"
import generalUtils from "../src/utils/general"

const BATCH_SIZE = 1024
const COORDS2ADDR_API =
  "http://ws.usig.buenosaires.gob.ar/geocoder/2.2/reversegeocoding"

const addAddresses = {
  name: "add_addresses",
  run: async () => {
    await dbUtils.connect(true)
    try {
      await addAddresses.processPlaces()
    } catch (error) {
      console.error(error)
    } finally {
      dbUtils.disconnect()
    }
  },
  processPlaces: async () => {
    const filter = {
      $or: [{ address: { $exists: false } }, { address: null }],
    }
    let skip = 0
    let count = 0
    let batch = 0
    do {
      const response = await placeService.getPlaces({
        filter,
        skip,
        limit: BATCH_SIZE,
      })
      count = response.count
      await addAddresses.processBatch(batch, response.data, count)
      skip += BATCH_SIZE
      batch += 1
    } while (from < count)
  },
  processBatch: async (batch, items, count) => {
    for (const [index, item] of items.entries()) {
      const current = batch * BATCH_SIZE + index + 1
      consoleUtils.printProgress("Processing item", current, count)
      await addAddresses.processItem(item)
    }
  },
  processItem: async (item) => {
    if (item.address) {
      return
    }
    const address = await addAddresses.getAddressOfLocation(item.location)
    if (address) {
      await placeService.updatePlace(item.id, {
        address,
      })
    } else {
      await placeService.deletePlace(item.id)
    }
  },
  getAddressOfLocation: async ({ longitude, latitude }) => {
    const response = await requestUtils.get(COORDS2ADDR_API, {
      x: longitude,
      y: latitude,
    })
    if (!response || !response.puerta) {
      return null
    }
    const { streetName, streetNumber } = addAddresses.getAddressParts(
      response.puerta,
    )
    const address = `${addAddresses.normalizeAddressName(
      streetName,
    )} ${streetNumber}`
    return address
  },
  getAddressParts: (address) => {
    const streetName = address.replace(/\s\d+.*$/, "")
    const streetNumber = address.match(/\s(\d+)(?:\s|$)/)?.[1] ?? ""
    return { streetName, streetNumber }
  },
  normalizeAddressName: (location) => {
    location = location.replace(/^(.+) AV\.?$/, "Avenida $1")
    location = location.replace(/^(.+), (.+)$/, "$2 $1")
    location = location.toLowerCase()
    return generalUtils.titleCase(location)
  },
}

export default addAddresses
