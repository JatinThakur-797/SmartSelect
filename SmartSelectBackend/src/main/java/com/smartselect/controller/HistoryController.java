package com.smartselect.controller;

import com.smartselect.dto.HistoryItemDto;
import com.smartselect.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class HistoryController {

    private final RecommendationService recommendationService;

    @GetMapping("/history")
    public ResponseEntity<List<HistoryItemDto>> getHistory(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<HistoryItemDto> history =
                recommendationService.getUserHistory(userDetails.getUsername());
        return ResponseEntity.ok(history);
    }
}
