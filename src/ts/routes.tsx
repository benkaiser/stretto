import * as React from "react";
import * as Router from "react-router";
import { Route, IndexRoute } from "react-router";

import AppFrame from "./components/app_frame";
import SongView from "./components/song_view";
import SyncView from "./components/sync_view";
import NotFoundView from "./components/not_found_view";

let routeMap = (
    <Route path="/" component={AppFrame}>
        <IndexRoute component={SongView}/>
        <Route path="playlist/:id" component={SongView}/>
        <Route path="sync" component={SyncView} />
        <Route path="*" component={NotFoundView} />
    </Route>
);

export default routeMap;
