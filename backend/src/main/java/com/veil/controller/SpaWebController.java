package com.veil.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Controller to forward SPA client routes to index.html when deployed as a
 * unified monolith container (Spring Boot serving built React static assets).
 */
@Controller
public class SpaWebController {

    @GetMapping(value = {
        "/",
        "/overview",
        "/studio",
        "/hide",
        "/extract",
        "/compare",
        "/security",
        "/history",
        "/learn",
        "/faq",
        "/settings",
        "/sharding",
        "/bitplane",
        "/provenance",
        "/analyzer",
        "/inspector"
    })
    public String forwardSpaRoutes() {
        return "forward:/index.html";
    }
}
