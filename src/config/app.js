import compression from "compression"
import express from "express"
import helmet from "helmet"
import cors from "cors"
import hpp from "hpp"
import morgan from "morgan"
import path from "path"

import envUtils, { env, nodeEnv } from "../utils/env"
import parseQueryMiddleware from "../middlewares/parseQuery"

const appConfig = {
  get host() {
    return envUtils.get(env.Host)
  },
  get port() {
    return envUtils.get(env.Port)
  },
  configure: (app) => {
    app.set("host", appConfig.host)
    app.set("port", appConfig.port)

    // HTTP headers
    app.disable("x-powered-by")

    // gzip compression
    app.use(compression())

    const corsConfig = {
      origin: true,
      credentials: true,
      exposedHeaders: ["Content-Range"],
    }

    if (envUtils.get(env.NodeEnv) === nodeEnv.Prod) {
      app.use(hpp())
      app.use(helmet())
      app.use(morgan("combined"))
      app.use(cors({ ...corsConfig, origin: appConfig.host }))
    } else {
      app.use(morgan("dev"))
      app.use(cors({ ...corsConfig }))
    }

    // Parse JSON
    app.use(express.json())

    // Parse URL-encoded data
    app.use(express.urlencoded({ extended: true }))

    // Serve static assets
    app.use("/assets", express.static(path.join(__dirname, "../../assets")))

    // Serve backend build
    app.use(
      express.static(path.join(__dirname, "../../../backend/build"), {
        index: false,
      }),
    )

    app.use(parseQueryMiddleware)
  },
}

export default appConfig
