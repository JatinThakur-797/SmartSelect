package com.smartselect.controller;

import com.smartselect.dto.RecommendationRequest;
import com.smartselect.dto.RecommendationResponse;
import com.smartselect.service.RecommendationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class RecommendController {

    private final RecommendationService recommendationService;

    @PostMapping("/recommend")
    public ResponseEntity<RecommendationResponse> recommend(
            @Valid @RequestBody RecommendationRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("Recommendation request from {} — category={}, budget={}",
                userDetails.getUsername(), request.getCategory(), request.getBudget());
        System.out.println(request.getCategory() + "reach to controller");
        RecommendationResponse response =
                recommendationService.recommend(request, userDetails.getUsername());

        return ResponseEntity.ok(response);
    }
}
